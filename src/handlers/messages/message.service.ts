import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException } from '../../common/exceptions';
import { DBClient } from '../../configs/dbClient';
import { validate } from '../../helpers/validate';
import { RoomServices } from '../rooms/room.service';
import { Message } from './message.model';
import { NewMessageSchema } from './message.schema';

export interface MessageServices {
    create(roomId: string, owner: string, message: string): Promise<Message>;
    findByRoomId(roomId: string): Promise<Message[]>;
}

export class MessageServices implements MessageServices {
    roomServices: RoomServices;
    constructor(roomServices = new RoomServices()) {
        this.roomServices = roomServices;
    }

    async create(roomId: string, owner: string, content: string): Promise<Message> {
        await validate(NewMessageSchema, { roomId, owner, content });

        const room = await this.roomServices.findById(roomId);
        if (!room) throw new BadRequestException(`Room #${roomId} not found`);

        const now = new Date().getTime();

        const message = plainToInstance(Message, {
            messageId: uuidv4(),
            roomId,
            owner,
            content,
            createdAt: now,
            updatedAt: now,
            type: 'MESSAGE',
        });

        const params: DocumentClient.BatchWriteItemInput = {
            RequestItems: {
                MAIN_TABLE: [
                    {
                        PutRequest: {
                            Item: {
                                pk: `ROOM#${roomId}`,
                                sk: `MESSAGE#${message.createdAt}#${message.messageId}`,
                                ...message,
                            },
                        },
                    },
                ],
            },
        };

        await DBClient.batchWrite(params).promise();

        return message;
    }

    async findByRoomId(roomId: string): Promise<Message[]> {
        const room = await this.roomServices.findById(roomId);
        if (!room) throw new BadRequestException(`Room #${roomId} not found`);

        const params: DocumentClient.QueryInput = {
            TableName: process.env.MAIN_TABLE,
            KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
            ExpressionAttributeValues: {
                ':pk': `ROOM#${roomId}`,
                ':sk': `MESSAGE#`,
            },
        };

        const { Items } = await DBClient.query(params).promise();

        const messages = Items.map((item) => plainToInstance(Message, item)) as Message[];

        return messages;
    }
}
