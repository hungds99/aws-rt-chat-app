import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException, InternalServerError, NotFoundException } from '../../common/exceptions';
import { Config } from '../../configs';
import { DBClient } from '../../configs/dbClient';
import { getAvatar } from '../../helpers/avatar';
import { validate } from '../../helpers/validate';
import { User } from './user.model';
import { NewUserValidationSchema } from './user.schema';

export interface UserServices {
    create(username: string, email: string, avatar?: string): Promise<User>;
    findByEmail(email: string): Promise<User>;
    findAll(): Promise<User[]>;
    findById(id: string): Promise<User>;
}

export class UserServices implements UserServices {
    async create(username: string, email: string, avatar?: string): Promise<User> {
        await validate(NewUserValidationSchema, { username, email });
        const user = await this.findByEmail(email);
        if (user) throw new BadRequestException('User already exists');

        try {
            const userId = uuidv4();
            const usernameSK = username.split(' ').join('').toLowerCase();

            const userParams = {
                userId,
                username,
                avatar: avatar ? avatar : getAvatar(usernameSK),
                email,
                createdAt: new Date().getTime(),
            };

            const params: DocumentClient.TransactWriteItemsInput = {
                TransactItems: [
                    {
                        Put: {
                            TableName: Config.dynamodb.MAIN_TABLE,
                            ConditionExpression: 'attribute_not_exists(pk)',
                            Item: {
                                pk: `USER#${userId}`,
                                sk: `META`,
                                gsi1pk: `USERS`,
                                gsi1sk: `USERNAME#${usernameSK}`,
                                ...userParams,
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
                            },
                        },
                    },
                ],
            };

            await DBClient.transactWrite(params).promise();

            const user: User = plainToInstance(User, { ...userParams });
            return user;
        } catch (error) {
            throw new InternalServerError(error);
        }
    }

    async findByEmail(email: string): Promise<User> {
        try {
            const params: DocumentClient.GetItemInput = {
                TableName: Config.dynamodb.MAIN_TABLE,
                Key: {
                    pk: `EMAIL#${email}`,
                    sk: `EMAIL`,
                },
            };
            const result = await DBClient.get(params).promise();
            const user = plainToInstance(User, result.Item, {
                excludeExtraneousValues: true,
            });
            return user;
        } catch (error) {
            throw new InternalServerError(error);
        }
    }

    async findAll(): Promise<User[]> {
        try {
            const params: DocumentClient.QueryInput = {
                TableName: Config.dynamodb.MAIN_TABLE,
                IndexName: 'gsi1',
                KeyConditionExpression: '#gsi1pk = :gsi1pk',
                ExpressionAttributeValues: {
                    ':gsi1pk': 'USERS',
                },
                ExpressionAttributeNames: {
                    '#gsi1pk': 'gsi1pk',
                },
            };
            const result = await DBClient.query({
                ...params,
            }).promise();
            const users: User[] = plainToInstance(User, result.Items, {
                excludeExtraneousValues: true,
            });
            return users;
        } catch (error) {
            throw new InternalServerError(error);
        }
    }

    async findById(id: string): Promise<User> {
        const params = {
            TableName: Config.dynamodb.MAIN_TABLE,
            Key: {
                pk: `USER#${id}`,
                sk: `META`,
            },
        };

        try {
            const result = await DBClient.get(params).promise();
            const user = plainToInstance(User, result.Item, {
                excludeExtraneousValues: true,
            });
            if (!user) throw new NotFoundException('User not found');
            return user;
        } catch (error) {
            throw new InternalServerError(error);
        }
    }
}
