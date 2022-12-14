import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { plainToInstance } from 'class-transformer';
import { ENV } from '../../common/environment';
import { InternalServerError, NotFoundException } from '../../common/exceptions';
import { DBClient } from '../../configs/dbClient';
import { User } from './user.model';

export interface IUserServices {
    findByConnectionId(connectionId: string): Promise<User>;
    findByIds(ids: string[]): Promise<User[]>;
    updateConnectionId(id: string, connectionId?: string): Promise<void>;
    findDetailByEmail(email: string, isAdmin: boolean): Promise<User>;
    findByEmail(email: string): Promise<String>;
    findAll(): Promise<User[]>;
    findById(id: string): Promise<User>;
}

export class UserServices implements IUserServices {
    async findByConnectionId(connectionId: string): Promise<User> {
        const params = {
            TableName: ENV.MAIN_TABLE,
            IndexName: 'gsi2',
            KeyConditionExpression: '#gsi2pk = :gsi2pk AND begins_with(#gsi2sk,:gsi2sk)',
            ExpressionAttributeValues: {
                ':gsi2pk': `CONNECTION#${connectionId}`,
                ':gsi2sk': `USER#`,
            },
            ExpressionAttributeNames: {
                '#gsi2pk': 'gsi2pk',
                '#gsi2sk': 'gsi2sk',
            },
        };
        const result = await DBClient.query(params).promise();
        const user = plainToInstance(User, result?.Items?.[0], {
            excludeExtraneousValues: true,
        });
        return user;
    }

    async findByIds(ids: string[]): Promise<User[]> {
        const params = {
            RequestItems: {
                [ENV.MAIN_TABLE]: {
                    Keys: ids.map((id) => ({
                        pk: `USER#${id}`,
                        sk: `META`,
                    })),
                },
            },
        };

        const result = await DBClient.batchGet(params).promise();
        const users: User[] = plainToInstance(User, result?.Responses?.[ENV.MAIN_TABLE], {
            excludeExtraneousValues: true,
        });
        return users;
    }

    async updateConnectionId(id: string, connectionId?: string): Promise<void> {
        const params: DocumentClient.UpdateItemInput = {
            TableName: ENV.MAIN_TABLE,
            Key: {
                pk: `USER#${id}`,
                sk: `META`,
            },
            UpdateExpression: 'SET #updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':updatedAt': new Date().toISOString(),
            },
            ExpressionAttributeNames: {
                '#gsi2pk': 'gsi2pk',
                '#gsi2sk': 'gsi2sk',
                '#connectionId': 'connectionId',
                '#updatedAt': 'updatedAt',
            },
        };

        if (!connectionId) {
            params.UpdateExpression += ' REMOVE #gsi2pk, #gsi2sk, #connectionId';
        } else {
            params.UpdateExpression += ', #gsi2pk = :gsi2pk, #gsi2sk = :gsi2sk, #connectionId = :connectionId';
            params.ExpressionAttributeValues = {
                ...params.ExpressionAttributeValues,
                ':gsi2pk': `CONNECTION#${connectionId}`,
                ':gsi2sk': `USER#${id}`,
                ':connectionId': connectionId,
            };
        }

        console.log('params', params);

        try {
            await DBClient.update(params).promise();
        } catch (error) {
            throw new InternalServerError(error);
        }
    }

    async findDetailByEmail(email: string, isAdmin: boolean = false): Promise<User> {
        const userId = await this.findByEmail(email);
        try {
            const params: DocumentClient.GetItemInput = {
                TableName: ENV.MAIN_TABLE,
                Key: {
                    pk: `USER#${userId}`,
                    sk: `META`,
                },
            };
            const result = await DBClient.get(params).promise();
            const user = plainToInstance(User, result?.Item, {
                groups: isAdmin ? ['admin'] : [],
                excludeExtraneousValues: true,
            });
            return user;
        } catch (error) {
            throw new InternalServerError(error);
        }
    }

    async findByEmail(email: string): Promise<String> {
        try {
            const params: DocumentClient.GetItemInput = {
                TableName: ENV.MAIN_TABLE,
                Key: {
                    pk: `EMAIL#${email}`,
                    sk: `EMAIL`,
                },
            };
            const result = await DBClient.get(params).promise();
            return result?.Item?.userId || '';
        } catch (error) {
            throw new InternalServerError(error);
        }
    }

    async findAll(): Promise<User[]> {
        try {
            const params: DocumentClient.QueryInput = {
                TableName: ENV.MAIN_TABLE,
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
            const users: User[] = plainToInstance(User, result?.Items, {
                excludeExtraneousValues: true,
            });
            return users || [];
        } catch (error) {
            throw new InternalServerError(error);
        }
    }

    async findById(id: string): Promise<User> {
        const params = {
            TableName: ENV.MAIN_TABLE,
            Key: {
                pk: `USER#${id}`,
                sk: `META`,
            },
        };
        const result = await DBClient.get(params).promise();
        const user = plainToInstance(User, result?.Item, {
            excludeExtraneousValues: true,
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }
}
