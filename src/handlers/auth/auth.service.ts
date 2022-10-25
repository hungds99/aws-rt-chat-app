import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import * as bcrypt from 'bcryptjs';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../../common/environment';
import { BadRequestException, InternalServerError, UnauthorizedException } from '../../common/exceptions';
import { DBClient } from '../../configs/dbClient';
import { generateJWT, verifyJWT } from '../../helpers/auth';
import { getAvatar } from '../../helpers/utils';
import { validateSchema } from '../../helpers/validate';
import { AuthUser, NewUser, User } from '../users/user.model';
import { IUserServices, UserServices } from '../users/user.service';
import { LoginUserSchema, RegisterUserSchema } from './auth.schema';

export interface IAuthServices {
    authorizer(token: string): Promise<User>;
    login(email: string, password: string): Promise<AuthUser>;
    register(user: NewUser): Promise<User>;
}

export class AuthServices implements IAuthServices {
    userServices: IUserServices;

    constructor(userServices: IUserServices = new UserServices()) {
        this.userServices = userServices;
    }

    async authorizer(token: string): Promise<User> {
        const tokenDecoded = await verifyJWT(token);
        if (!tokenDecoded) throw new UnauthorizedException('Invalid token');
        const user = await this.userServices.findById(tokenDecoded?.user?.id);
        return user;
    }

    async login(email: string, password: string): Promise<AuthUser> {
        await validateSchema(LoginUserSchema, { email, password });
        const user = await this.userServices.findDetailByEmail(email, true);
        if (!user || !bcrypt.compareSync(password, user.password)) throw new UnauthorizedException('Wrong credentials');
        try {
            const accessToken = generateJWT({ ...user, password: undefined }, { expiresIn: '1d' });
            const refreshToken = generateJWT({ ...user, password: undefined }, { expiresIn: '30d' });
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
        const userIdExisted = await this.userServices.findByEmail(email);
        if (userIdExisted) throw new BadRequestException('User already exists');

        try {
            const now = new Date().getTime();
            const passwordHashed = bcrypt.hashSync(password, 6);
            const user: User = {
                id: uuidv4(),
                firstName,
                lastName,
                email,
                password: passwordHashed,
                avatar: getAvatar(new Date().getTime().toString()),
                createdAt: now,
                updatedAt: now,
                type: 'USER',
            };

            const params: DocumentClient.TransactWriteItemsInput = {
                TransactItems: [
                    {
                        Put: {
                            TableName: ENV.MAIN_TABLE,
                            ConditionExpression: 'attribute_not_exists(pk)',
                            Item: {
                                pk: `USER#${user.id}`,
                                sk: `META`,
                                gsi1pk: `USERS`,
                                gsi1sk: `CREATED_AT#${user.createdAt}`,
                                ...user,
                            },
                        },
                    },
                    {
                        Put: {
                            TableName: ENV.MAIN_TABLE,
                            ConditionExpression: 'attribute_not_exists(pk)',
                            Item: {
                                pk: `EMAIL#${email}`,
                                sk: `EMAIL`,
                                userId: user.id,
                            },
                        },
                    },
                ],
            };
            await DBClient.transactWrite(params).promise();
            return plainToInstance(User, user, { excludeExtraneousValues: true });
        } catch (error) {
            throw new InternalServerError(error);
        }
    }
}
