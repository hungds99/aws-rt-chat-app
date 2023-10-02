import { DBClient, getEnv } from '@common/configs';
import { InternalServerException, NotFoundException } from '@common/exceptions';
import { User } from '@models/user';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { plainToInstance } from 'class-transformer';

interface UserServices {
  findByConnectionId(connectionId: string): Promise<User>;
  findByIds(ids: string[]): Promise<User[]>;
  updateConnectionId(id: string, connectionId?: string): Promise<void>;
  findDetailByEmail(email: string, isAdmin: boolean): Promise<User>;
  findByEmail(email: string): Promise<String>;
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User>;
}

export default class BaseUserServices implements UserServices {
  constructor() {}

  async findByConnectionId(connectionId: string): Promise<User> {
    const params = {
      TableName: getEnv().MAIN_TABLE,
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
        [getEnv().MAIN_TABLE]: {
          Keys: ids.map((id) => ({
            pk: `USER#${id}`,
            sk: `META`,
          })),
        },
      },
    };

    const result = await DBClient.batchGet(params).promise();
    const users: User[] = plainToInstance(User, result?.Responses?.[getEnv().MAIN_TABLE], {
      excludeExtraneousValues: true,
    });
    return users;
  }

  async updateConnectionId(id: string, connectionId?: string): Promise<void> {
    const params: DocumentClient.UpdateItemInput = {
      TableName: getEnv().MAIN_TABLE,
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
      params.UpdateExpression +=
        ', #gsi2pk = :gsi2pk, #gsi2sk = :gsi2sk, #connectionId = :connectionId';
      params.ExpressionAttributeValues = {
        ...params.ExpressionAttributeValues,
        ':gsi2pk': `CONNECTION#${connectionId}`,
        ':gsi2sk': `USER#${id}`,
        ':connectionId': connectionId,
      };
    }

    try {
      await DBClient.update(params).promise();
    } catch (error) {
      throw new InternalServerException(error);
    }
  }

  async findDetailByEmail(email: string, isAdmin: boolean = false): Promise<User> {
    const userId = await this.findByEmail(email);
    try {
      const params: DocumentClient.GetItemInput = {
        TableName: getEnv().MAIN_TABLE,
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
      throw new InternalServerException(error);
    }
  }

  async findByEmail(email: string): Promise<String> {
    try {
      const params: DocumentClient.GetItemInput = {
        TableName: getEnv().MAIN_TABLE,
        Key: {
          pk: `EMAIL#${email}`,
          sk: `EMAIL`,
        },
      };
      const result = await DBClient.get(params).promise();
      return result?.Item?.userId || '';
    } catch (error) {
      throw new InternalServerException(error);
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const params: DocumentClient.QueryInput = {
        TableName: getEnv().MAIN_TABLE,
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
      throw new InternalServerException(error);
    }
  }

  async findById(id: string): Promise<User> {
    const params = {
      TableName: getEnv().MAIN_TABLE,
      Key: {
        pk: `USER#${id}`,
        sk: `META`,
      },
    };
    const result = await DBClient.get(params).promise();
    const user = plainToInstance(User, result?.Item, {
      excludeExtraneousValues: true,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
