import { DBClient, getEnv } from '@common/configs';
import { NotFoundException } from '@common/exceptions';
import { Message } from '@models/message';
import { validateSchema } from '@utils/validation';
import { NewMessageSchema } from '@validations/message';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import BaseRoomServices from './room';

interface MessageServices {
  create(roomId: string, owner: string, message: string): Promise<Message>;
  findByRoomId(roomId: string): Promise<Message[]>;
}

export default class BaseMessageServices implements MessageServices {
  roomServices: BaseRoomServices;

  constructor(roomServices: BaseRoomServices = new BaseRoomServices()) {
    this.roomServices = roomServices;
  }

  async create(roomId: string, owner: string, content: string): Promise<Message> {
    await validateSchema(NewMessageSchema, { roomId, owner, content });
    const now = new Date().getTime();
    const message = plainToInstance(Message, {
      id: uuidv4(),
      roomId,
      owner,
      content,
      createdAt: now,
      updatedAt: now,
      type: 'MESSAGE',
    });

    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Put: {
            TableName: getEnv().MAIN_TABLE,
            Item: {
              pk: `ROOM#${roomId}`,
              sk: `MESSAGE#${message.createdAt}`,
              ...message,
            },
          },
        },
        {
          Update: {
            TableName: getEnv().MAIN_TABLE,
            Key: {
              pk: `ROOM#${roomId}`,
              sk: 'META',
            },
            UpdateExpression: 'SET #updatedAt = :updatedAt, #lastMessage = :lastMessage',
            ExpressionAttributeNames: {
              '#updatedAt': 'updatedAt',
              '#lastMessage': 'lastMessage',
            },
            ExpressionAttributeValues: {
              ':updatedAt': now,
              ':lastMessage': {
                ...message,
              },
            },
          },
        },
      ],
    };
    await DBClient.transactWrite(params).promise();
    return message;
  }

  async findByRoomId(roomId: string): Promise<Message[]> {
    const room = await this.roomServices.findById(roomId);
    if (!room) {
      throw new NotFoundException(`Room #${roomId} not found`);
    }
    const params: DocumentClient.QueryInput = {
      TableName: getEnv().MAIN_TABLE,
      KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
      ExpressionAttributeValues: {
        ':pk': `ROOM#${roomId}`,
        ':sk': 'MESSAGE#',
      },
    };
    const { Items } = await DBClient.query(params).promise();
    const messages = plainToInstance(Message, Items);
    return messages;
  }
}
