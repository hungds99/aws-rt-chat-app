import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { plainToInstance } from 'class-transformer';
import { InternalServerError, NotFoundException } from '../../common/exceptions';
import { Config } from '../../configs';
import { DBClient } from '../../configs/dbClient';
import { User } from './user.model';

export interface UserServices {
    findDetailByEmail(email: string, isAdmin: boolean): Promise<User>;
    findByEmail(email: string): Promise<String>;
    findAll(): Promise<User[]>;
    findById(id: string): Promise<User>;
}

export class UserServices implements UserServices {
    async findDetailByEmail(email: string, isAdmin: boolean = false): Promise<User> {
        const userId = await this.findByEmail(email);
        try {
            const params: DocumentClient.GetItemInput = {
                TableName: Config.dynamodb.MAIN_TABLE,
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
                TableName: Config.dynamodb.MAIN_TABLE,
                Key: {
                    pk: `EMAIL#${email}`,
                    sk: `EMAIL`,
                },
            };
            const result = await DBClient.get(params).promise();
            const user = plainToInstance(User, result?.Item);
            return user?.userId || '';
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
            TableName: Config.dynamodb.MAIN_TABLE,
            Key: {
                pk: `USER#${id}`,
                sk: `META`,
            },
        };

        try {
            const result = await DBClient.get(params).promise();
            const user = plainToInstance(User, result?.Item, {
                excludeExtraneousValues: true,
            });
            if (!user) throw new NotFoundException('User not found');
            return user;
        } catch (error) {
            throw new InternalServerError(error);
        }
    }
}
