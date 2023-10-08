import { DBClient, getEnv } from '@common/configs';
import { NotFoundException } from '@common/exceptions';
import { Room } from '@models/room';
import { chunkDBQueryIDsInOperator } from '@utils/dynamodb';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { plainToClass } from 'class-transformer';

interface RoomRepository {
  findByIds(ids: string[]): Promise<Room[] | []>;
  findById(id: string): Promise<Room | null>;
  getById(id: string): Promise<Room>;
  findAll(): Promise<Room[] | []>;
  findPrivate(memberIds: string[]): Promise<Room | null>;
  findAllByUserId(userId: string): Promise<Room[] | []>;
  createPrivate(room: Room): Promise<Room>;
  createGroup(room: Room): Promise<Room>;
}

export default class BaseRoomRepository implements RoomRepository {
  constructor() {}

  async findByIds(ids: string[]): Promise<Room[]> {
    const { chunkedExpressionAttributeValues, chunkedFilterExpression } =
      chunkDBQueryIDsInOperator(ids);

    const params: DocumentClient.QueryInput = {
      TableName: getEnv().MAIN_TABLE,
      IndexName: 'gsi1',
      KeyConditionExpression: '#gsi1pk = :gsi1pk AND begins_with(#gsi1sk, :gsi1sk)',
      ExpressionAttributeNames: {
        '#gsi1pk': 'gsi1pk',
        '#gsi1sk': 'gsi1sk',
      },
      ExpressionAttributeValues: {
        ':gsi1pk': 'ROOMS',
        ':gsi1sk': 'UPDATED_AT#',
        ...chunkedExpressionAttributeValues,
      },
      FilterExpression: chunkedFilterExpression,
    };
    const result = await DBClient.query(params).promise();
    const rooms = plainToClass(Room, result.Items, {
      excludeExtraneousValues: true,
    });
    return rooms || [];
  }

  async findById(id: string): Promise<Room | null> {
    const params: DocumentClient.GetItemInput = {
      TableName: getEnv().MAIN_TABLE,
      Key: {
        pk: `ROOM#${id}`,
        sk: 'META',
      },
    };
    const result = await DBClient.get(params).promise();
    const room = plainToClass(Room, result.Item);
    return room || null;
  }

  async getById(id: string): Promise<Room> {
    const room = await this.findById(id);
    if (!room) {
      throw new NotFoundException(`Room #${id} not found`);
    }
    return room;
  }

  async findAll(): Promise<Room[]> {
    const params: DocumentClient.ScanInput = {
      TableName: getEnv().MAIN_TABLE,
      FilterExpression: 'begins_with(#pk, :pk) AND #sk = :sk',
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#sk': 'sk',
      },
      ExpressionAttributeValues: {
        ':pk': 'ROOM#',
        ':sk': 'META',
      },
    };
    const result = await DBClient.scan(params).promise();
    const rooms = plainToClass(Room, result.Items, {
      excludeExtraneousValues: true,
    });
    return rooms || [];
  }

  async findPrivate(memberIds: string[]): Promise<Room | null> {
    const params: DocumentClient.BatchGetItemInput = {
      RequestItems: {
        MAIN_TABLE: {
          Keys: [
            {
              pk: `PRIVATE_ROOM#${memberIds[0]}`,
              sk: `PRIVATE_ROOM#${memberIds[1]}`,
            },
            {
              pk: `PRIVATE_ROOM#${memberIds[1]}`,
              sk: `PRIVATE_ROOM#${memberIds[0]}`,
            },
          ],
        },
      },
    };

    const result = await DBClient.batchGet(params).promise();
    if (!result?.Responses?.MAIN_TABLE?.length) {
      return null;
    }
    const room = await this.findById(result?.Responses?.MAIN_TABLE[0]?.roomId);
    return room;
  }

  async findAllByUserId(userId: string): Promise<Room[]> {
    const params: DocumentClient.QueryInput = {
      TableName: getEnv().MAIN_TABLE,
      IndexName: 'gsi1',
      KeyConditionExpression: 'gsi1pk = :pk AND begins_with(gsi1sk, :sk)',
      ExpressionAttributeValues: {
        ':pk': `MEMBER#${userId}`,
        ':sk': 'ROOM#',
      },
    };
    const result = await DBClient.query(params).promise();
    const rooms = await this.findByIds(result.Items.map((item) => item.gsi1sk.split('#')[1]));
    return rooms;
  }

  async createPrivate(room: Room): Promise<Room> {
    const params: DocumentClient.BatchWriteItemInput = {
      RequestItems: {
        MAIN_TABLE: [
          {
            PutRequest: {
              Item: {
                pk: `ROOM#${room.id}`,
                sk: 'META',
                gsi1pk: 'ROOMS',
                gsi1sk: `UPDATED_AT#${room.updatedAt}`,
                ...room,
              },
            },
          },
          {
            PutRequest: {
              Item: {
                pk: `ROOM#${room.id}`,
                sk: `MEMBER#${room.memberIds[0]}`,
                gsi1pk: `MEMBER#${room.memberIds[0]}`,
                gsi1sk: `ROOM#${room.id}`,
              },
            },
          },
          {
            PutRequest: {
              Item: {
                pk: `ROOM#${room.id}`,
                sk: `MEMBER#${room.memberIds[1]}`,
                gsi1pk: `MEMBER#${room.memberIds[1]}`,
                gsi1sk: `ROOM#${room.id}`,
              },
            },
          },
          {
            PutRequest: {
              Item: {
                pk: `PRIVATE_ROOM#${room.memberIds[0]}`,
                sk: `PRIVATE_ROOM#${room.memberIds[1]}`,
                roomId: room.id,
              },
            },
          },
          {
            PutRequest: {
              Item: {
                pk: `PRIVATE_ROOM#${room.memberIds[1]}`,
                sk: `PRIVATE_ROOM#${room.memberIds[0]}`,
                roomId: room.id,
              },
            },
          },
        ],
      },
    };

    await DBClient.batchWrite(params).promise();
    return room;
  }

  async createGroup(room: Room): Promise<Room> {
    const params: DocumentClient.BatchWriteItemInput = {
      RequestItems: {
        MAIN_TABLE: [
          {
            PutRequest: {
              Item: {
                pk: `ROOM#${room.id}`,
                sk: 'META',
                gsi1pk: 'ROOMS',
                gsi1sk: `UPDATED_AT#${room.updatedAt}`,
                ...room,
              },
            },
          },
          ...[...room.memberIds].map((userId) => ({
            PutRequest: {
              Item: {
                pk: `ROOM#${room.id}`,
                sk: `MEMBER#${userId}`,
                gsi1pk: `MEMBER#${userId}`,
                gsi1sk: `ROOM#${room.id}`,
                id: room.id,
                userId: userId,
                createdAt: room.createdAt,
              },
            },
          })),
        ],
      },
    };

    await DBClient.batchWrite(params).promise();

    return room;
  }
}
