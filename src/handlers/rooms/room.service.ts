import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException } from '../../common/exceptions';
import { DBClient } from '../../configs/dbClient';
import { validate } from '../../helpers/validate';
import { Room } from './room.model';
import { NewRoomSchema } from './room.schema';

export interface RoomServices {
    create(createdBy: string, members: string[], type: 'GROUP' | 'PRIVATE'): Promise<Room>;
    createPrivate(room: Room): Promise<Room>;
    createGroup(room: Room): Promise<Room>;
    findPrivate(memberIds: string[]): Promise<Room>;
    findById(roomId: string): Promise<Room>;
    findByUserId(userId: string): Promise<Room[]>;
}

export class RoomServices implements RoomServices {
    async create(createdBy: string, members: string[], type: 'GROUP' | 'PRIVATE'): Promise<Room> {
        await validate(NewRoomSchema, { createdBy, members, type });
        const now = new Date().getTime();
        const room = plainToInstance(Room, {
            roomId: uuidv4(),
            createdBy,
            members,
            type: type === 'GROUP' ? 'GROUP_ROOM' : 'PRIVATE_ROOM',
            createdAt: now,
            updatedAt: now,
        });

        type === 'PRIVATE' ? await this.createPrivate(room) : await this.createGroup(room);

        return room;
    }

    async createGroup(room: Room): Promise<Room> {
        const params: DocumentClient.BatchWriteItemInput = {
            RequestItems: {
                MAIN_TABLE: [
                    {
                        PutRequest: {
                            Item: {
                                pk: `ROOM#${room.roomId}`,
                                sk: `META`,
                                ...room,
                            },
                        },
                    },
                    ...[...room.members].map((userId) => ({
                        PutRequest: {
                            Item: {
                                pk: `ROOM#${room.roomId}`,
                                sk: `MEMBER#${userId}`,
                                gsi1pk: `USER#${userId}`,
                                gsi1sk: `ROOM#${room.roomId}`,
                            },
                        },
                    })),
                ],
            },
        };

        await DBClient.batchWrite(params).promise();

        return room;
    }

    async createPrivate(room: Room): Promise<Room> {
        if (room.members.length !== 2) throw new BadRequestException('Private room can only have 2 users');
        const roomExisted = await this.findPrivate(room.members);
        if (roomExisted) return roomExisted;

        const params: DocumentClient.BatchWriteItemInput = {
            RequestItems: {
                MAIN_TABLE: [
                    {
                        PutRequest: {
                            Item: {
                                pk: `ROOM#${room.roomId}`,
                                sk: `META`,
                                ...room,
                            },
                        },
                    },
                    {
                        PutRequest: {
                            Item: {
                                pk: `ROOM#${room.roomId}`,
                                sk: `MEMBER#${room.members[0]}`,
                                gsi1pk: `USER#${room.members[0]}`,
                                gsi1sk: `ROOM#${room.roomId}`,
                            },
                        },
                    },
                    {
                        PutRequest: {
                            Item: {
                                pk: `ROOM#${room.roomId}`,
                                sk: `MEMBER#${room.members[1]}`,
                                gsi1pk: `USER#${room.members[1]}`,
                                gsi1sk: `ROOM#${room.roomId}`,
                            },
                        },
                    },
                    {
                        PutRequest: {
                            Item: {
                                pk: `PRIVATE_ROOM#${room.members[0]}`,
                                sk: `PRIVATE_ROOM#${room.members[1]}`,
                                roomId: room.roomId,
                                createdAt: room.createdAt,
                            },
                        },
                    },
                    {
                        PutRequest: {
                            Item: {
                                pk: `PRIVATE_ROOM#${room.members[1]}`,
                                sk: `PRIVATE_ROOM#${room.members[0]}`,
                                roomId: room.roomId,
                                createdAt: room.createdAt,
                            },
                        },
                    },
                ],
            },
        };

        await DBClient.batchWrite(params).promise();

        return room;
    }

    async findPrivate(members: string[]): Promise<Room> {
        const params: DocumentClient.BatchGetItemInput = {
            RequestItems: {
                MAIN_TABLE: {
                    Keys: [
                        {
                            pk: `PRIVATE_ROOM#${members[0]}`,
                            sk: `PRIVATE_ROOM#${members[1]}`,
                        },
                        {
                            pk: `PRIVATE_ROOM#${members[1]}`,
                            sk: `PRIVATE_ROOM#${members[0]}`,
                        },
                    ],
                },
            },
        };

        const result = await DBClient.batchGet(params).promise();
        const room = plainToInstance(Room, result.Responses.MAIN_TABLE[0]);
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

    async findByUserId(userId: string): Promise<Room[]> {
        const params: DocumentClient.QueryInput = {
            TableName: 'MAIN_TABLE',
            IndexName: 'gsi1',
            KeyConditionExpression: 'gsi1pk = :pk AND begins_with(gsi1sk, :sk)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':sk': 'ROOM#',
            },
        };
        const result = await DBClient.query(params).promise();
        const rooms = plainToInstance(Room, result.Items);
        return rooms;
    }
}
