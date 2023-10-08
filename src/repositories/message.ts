import { DBClient, getEnv } from '@common/configs';
import { Message } from '@models/message';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { plainToClass } from 'class-transformer';

interface MessageRepository {
  create(message: Message): Promise<Message>;
  findAllByRoomId(roomId: string): Promise<Message[] | []>;
}

export class BaseMessageRepository implements MessageRepository {
  constructor() {}

  async create(message: Message): Promise<Message> {
    const params: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Put: {
            TableName: getEnv().MAIN_TABLE,
            Item: {
              pk: `ROOM#${message.roomId}`,
              sk: `MESSAGE#${message.createdAt}`,
              ...message,
            },
          },
        },
        {
          Update: {
            TableName: getEnv().MAIN_TABLE,
            Key: {
              pk: `ROOM#${message.roomId}`,
              sk: 'META',
            },
            UpdateExpression: 'SET #updatedAt = :updatedAt, #lastMessage = :lastMessage',
            ExpressionAttributeNames: {
              '#updatedAt': 'updatedAt',
              '#lastMessage': 'lastMessage',
            },
            ExpressionAttributeValues: {
              ':updatedAt': new Date().getTime(),
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

  async findAllByRoomId(roomId: string): Promise<Message[] | []> {
    const params: DocumentClient.QueryInput = {
      TableName: getEnv().MAIN_TABLE,
      KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
      ExpressionAttributeValues: {
        ':pk': `ROOM#${roomId}`,
        ':sk': 'MESSAGE#',
      },
    };
    const { Items } = await DBClient.query(params).promise();
    const messages = plainToClass(Message, Items);
    return messages || [];
  }
}
