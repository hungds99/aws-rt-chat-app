import { DBClient, getEnv } from '@common/configs';
import { NotFoundException } from '@common/exceptions';
import { User } from '@models/user';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { plainToClass } from 'class-transformer';

interface UserRepository {
  create(user: User): Promise<User>;
  findByConnectionId(connectionId: string): Promise<User | null>;
  findByIds(ids: string[]): Promise<User[] | []>;
  findUserIdByEmail(email: string): Promise<string | ''>;
  findById(id: string): Promise<User | null>;
  getById(id: string): Promise<User>;
  findAll(): Promise<User[] | []>;
  updateProfile(user: User): Promise<User>;
}

export class BaseUserRepository implements UserRepository {
  constructor() {}

  async create(user: User): Promise<User> {
    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Put: {
            TableName: getEnv().MAIN_TABLE,
            ConditionExpression: 'attribute_not_exists(pk)',
            Item: {
              pk: `USER#${user.id}`,
              sk: 'META',
              gsi1pk: 'USERS',
              gsi1sk: `CREATED_AT#${user.createdAt}`,
              ...user,
            },
          },
        },
        {
          Put: {
            TableName: getEnv().MAIN_TABLE,
            ConditionExpression: 'attribute_not_exists(pk)',
            Item: {
              pk: `EMAIL#${user.email}`,
              sk: 'EMAIL',
              userId: user.id,
            },
          },
        },
      ],
    };
    await DBClient.transactWrite(params).promise();
    const createdUser = plainToClass(User, user, { excludeExtraneousValues: true });

    return createdUser;
  }

  async findByConnectionId(connectionId: string): Promise<User | null> {
    const params = {
      TableName: getEnv().MAIN_TABLE,
      IndexName: 'gsi2',
      KeyConditionExpression: '#gsi2pk = :gsi2pk AND begins_with(#gsi2sk,:gsi2sk)',
      ExpressionAttributeValues: {
        ':gsi2pk': `CONNECTION#${connectionId}`,
        ':gsi2sk': 'USER#',
      },
      ExpressionAttributeNames: {
        '#gsi2pk': 'gsi2pk',
        '#gsi2sk': 'gsi2sk',
      },
    };
    const result = await DBClient.query(params).promise();
    const user = plainToClass(User, result?.Items?.[0], {
      excludeExtraneousValues: true,
    });
    return user || null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    const params = {
      RequestItems: {
        [getEnv().MAIN_TABLE]: {
          Keys: ids.map((id) => ({
            pk: `USER#${id}`,
            sk: 'META',
          })),
        },
      },
    };

    const result = await DBClient.batchGet(params).promise();
    const users: User[] = plainToClass(User, result?.Responses?.[getEnv().MAIN_TABLE], {
      excludeExtraneousValues: true,
    });
    return users;
  }

  async findUserIdByEmail(email: string): Promise<string | ''> {
    const params: DocumentClient.GetItemInput = {
      TableName: getEnv().MAIN_TABLE,
      Key: {
        pk: `EMAIL#${email}`,
        sk: 'EMAIL',
      },
    };
    const result = await DBClient.get(params).promise();
    return result?.Item?.userId || '';
  }

  async findById(id: string): Promise<User | null> {
    const params = {
      TableName: getEnv().MAIN_TABLE,
      Key: {
        pk: `USER#${id}`,
        sk: 'META',
      },
    };
    const result = await DBClient.get(params).promise();
    const user = plainToClass(User, result?.Item, {
      excludeExtraneousValues: true,
      groups: ['admin'],
    });
    return user || null;
  }

  async getById(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async findAll(): Promise<User[] | []> {
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
    const users: User[] = plainToClass(User, result?.Items, {
      excludeExtraneousValues: true,
    });

    return users || [];
  }

  async updateProfile(user: User): Promise<User> {
    const params: DocumentClient.UpdateItemInput = {
      TableName: getEnv().MAIN_TABLE,
      Key: {
        pk: `USER#${user.id}`,
        sk: 'META',
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

    if (!user.connectionId) {
      params.UpdateExpression += ' REMOVE #gsi2pk, #gsi2sk, #connectionId';
    } else {
      params.UpdateExpression +=
        ', #gsi2pk = :gsi2pk, #gsi2sk = :gsi2sk, #connectionId = :connectionId';
      params.ExpressionAttributeValues = {
        ...params.ExpressionAttributeValues,
        ':gsi2pk': `CONNECTION#${user.connectionId}`,
        ':gsi2sk': `USER#${user.id}`,
        ':connectionId': user.connectionId,
      };
    }

    await DBClient.update(params).promise();

    return user;
  }
}
