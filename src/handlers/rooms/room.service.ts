import { Room } from './room.model';
import { v4 as uuidv4 } from 'uuid';
import { plainToInstance } from 'class-transformer';
import { DBClient } from '../../configs/dbClient';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { BadRequestException } from '../../common/exceptions';

export interface RoomServices {
    create(createdBy: string, userIds: string[], type: 'GROUP' | 'PRIVATE'): Promise<Room>;
    findPrivateRoom(userIds: string[]): Promise<any>;
    findById(roomId: string): Promise<Room>;
}

export class RoomServices implements RoomServices {
    async create(createdBy: string, userIds: string[], type: 'GROUP' | 'PRIVATE'): Promise<Room> {
        const roomId = uuidv4();

        const roomParams = {
            roomId,
            // roomName,
            createdAt: new Date().getTime(),
            // createdBy: userId,
        };

        const room = plainToInstance(Room, roomParams);

        return room;
    }

    async findPrivateRoom(userIds: string[]): Promise<any> {
        if (userIds.length !== 2) throw new BadRequestException('Invalid user ids');
        const params: DocumentClient.BatchGetItemInput = {
            RequestItems: {
                MAIN_TABLE: {
                    Keys: [
                        {
                            pk: `PRIVATE_ROOM#${userIds[0]}`,
                            sk: `PRIVATE_ROOM#${userIds[1]}`,
                        },
                        {
                            pk: `PRIVATE_ROOM#${userIds[1]}`,
                            sk: `PRIVATE_ROOM#${userIds[0]}`,
                        },
                    ],
                },
            },
        };

        const result = await DBClient.batchGet(params).promise();
        const room = result.Responses.MAIN_TABLE[0];
        return room;
    }

    async findById(roomId: string): Promise<Room> {
        const params: DocumentClient.GetItemInput = {
            TableName: 'MAIN_TABLE',
            Key: {
                pk: `ROOM#${roomId}`,
                sk: `META`,
            },
        };

        const result = await DBClient.get(params).promise();
        const room = plainToInstance(Room, result.Item);
        return room;
    }
}
