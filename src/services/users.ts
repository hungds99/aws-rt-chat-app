import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { DBClient } from '../configs/dbClient';
import { Environments } from '../configs/environments';
import { User } from '../models/user';

export interface UserServices {
    findAll(): Promise<User[]>;
    create(userName: string, email: string): Promise<User>;
    findById(id: string): Promise<User>;
    findByEmail(email: string): Promise<User>;
}

export class UserServices implements UserServices {
    async findAll(): Promise<User[]> {
        try {
            const params: DocumentClient.QueryInput = {
                TableName: Environments.MAIN_TABLE,
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
            const users: User[] = plainToInstance(User, result.Items);
            return users;
        } catch (error) {
            throw Error(error);
        }
    }

    async create(userName: string, email: string): Promise<User> {
        const user = await this.findByEmail(email);
        if (user) throw Error('User already exists');

        try {
            const userId = uuidv4();
            const createdAt = new Date().getTime();

            const params: DocumentClient.TransactWriteItemsInput = {
                TransactItems: [
                    {
                        Put: {
                            TableName: Environments.MAIN_TABLE,
                            ConditionExpression: 'attribute_not_exists(pk)',
                            Item: {
                                pk: `USER_ID#${userId}`,
                                sk: `CREATED_AT#${createdAt}`,
                                gsi1pk: `USERS`,
                                gsi1sk: `USERNAME#${userName.toLowerCase()}`,
                                userId,
                                userName,
                                email,
                            },
                        },
                    },
                    {
                        Put: {
                            TableName: Environments.MAIN_TABLE,
                            ConditionExpression: 'attribute_not_exists(pk)',
                            Item: {
                                pk: `USER_EMAIL#${email}`,
                            },
                        },
                    },
                ],
            };

            await DBClient.transactWrite(params).promise();

            const user: User = plainToInstance(User, {
                userId,
                email,
                userName,
                createdAt,
            });
            return user;
        } catch (error) {
            throw Error('Could not create user');
        }
    }

    async findByEmail(email: string): Promise<User> {
        try {
            const params: DocumentClient.GetItemInput = {
                TableName: Environments.MAIN_TABLE,
                Key: {
                    pk: `USER_EMAIL#${email}`,
                },
            };
            const result = await DBClient.get(params).promise();
            const user = plainToInstance(User, result.Item);
            return user;
        } catch (error) {
            throw Error(error);
        }
    }

    async findById(id: string): Promise<User> {
        const params = {
            TableName: Environments.MAIN_TABLE,
            Key: {
                pk: `USER_ID#${id}`,
            },
        };

        try {
            const result = await DBClient.get(params).promise();
            const user = plainToInstance(User, result);
            return user;
        } catch (error) {
            throw Error(error);
        }
    }
}
