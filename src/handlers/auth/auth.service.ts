import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import * as bcrypt from 'bcryptjs';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException, InternalServerError, UnauthorizedException } from '../../common/exceptions';
import { Config } from '../../configs';
import { DBClient } from '../../configs/dbClient';
import { generateJWT } from '../../helpers/auth';
import { getAvatar } from '../../helpers/utils';
import { validateSchema } from '../../helpers/validate';
import { AuthUser, NewUser, User } from '../users/user.model';
import { UserServices } from '../users/user.service';
import { RegisterUserSchema } from './auth.schema';

export interface AuthServices {
    login(email: string, password: string): Promise<AuthUser>;
    register(user: NewUser): Promise<User>;
}

export class AuthServices implements AuthServices {
    userServices: UserServices;
    constructor(userServices = new UserServices()) {
        this.userServices = userServices;
    }

    async login(email: string, password: string): Promise<AuthUser> {
        const user = await this.userServices.findDetailByEmail(email, true);
        if (!user || !bcrypt.compareSync(password, user.password)) throw new UnauthorizedException('Wrong credentials');
        try {
            const accessToken = generateJWT({ user }, { expiresIn: '1d' });
            const refreshToken = generateJWT({ user }, { expiresIn: '30d' });
            const authUser = plainToInstance(
                AuthUser,
                {
                    ...user,
                    accessToken,
                    refreshToken,
                },
                {
                    excludeExtraneousValues: true,
                },
            );
            return authUser;
        } catch (error) {
            throw new InternalServerError(error);
        }
    }

    async register(newUser: NewUser): Promise<User> {
        const { email, password, firstName, lastName } = newUser;
        await validateSchema(RegisterUserSchema, { ...newUser });
        const userExisted = await this.userServices.findByEmail(email);
        if (userExisted) throw new BadRequestException('User already exists');

        try {
            const now = new Date().getTime();
            const passwordHashed = bcrypt.hashSync(password, 6);
            const user: User = plainToInstance(User, {
                userId: uuidv4(),
                firstName,
                lastName,
                email,
                password: passwordHashed,
                avatar: getAvatar(new Date().getTime().toString()),
                createdAt: now,
                updatedAt: now,
                type: 'USER',
            });

            const params: DocumentClient.TransactWriteItemsInput = {
                TransactItems: [
                    {
                        Put: {
                            TableName: Config.dynamodb.MAIN_TABLE,
                            ConditionExpression: 'attribute_not_exists(pk)',
                            Item: {
                                pk: `USER#${user.userId}`,
                                sk: `META`,
                                gsi1pk: `USERS`,
                                gsi1sk: `CREATED_AT#${user.createdAt}`,
                                ...user,
                            },
                        },
                    },
                    {
                        Put: {
                            TableName: Config.dynamodb.MAIN_TABLE,
                            ConditionExpression: 'attribute_not_exists(pk)',
                            Item: {
                                pk: `EMAIL#${email}`,
                                sk: `EMAIL`,
                                userId: user.userId,
                            },
                        },
                    },
                ],
            };
            await DBClient.transactWrite(params).promise();
            return user;
        } catch (error) {
            throw new InternalServerError(error);
        }
    }
}