import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../../common/environment';
import { BadRequestException, NotFoundException } from '../../common/exceptions';
import { DBClient } from '../../configs/dbClient';
import { chunkDBQueryIDsInOperator } from '../../helpers/utils';
import { validateSchema } from '../../helpers/validate';
import { IUserServices, UserServices } from '../users/user.service';
import { Room } from './room.model';
import { NewRoomSchema } from './room.schema';

export interface IRoomServices {
    findByIds(ids: string[]): Promise<Room[]>;
    findAll(): Promise<Room[]>;
    create(owner: string, members: string[], type: 'GROUP' | 'PRIVATE'): Promise<{ room: Room; isExisted: boolean }>;
    createPrivate(room: Room): Promise<{ room: Room; isExisted: boolean }>;
    createGroup(room: Room): Promise<Room>;
    findPrivate(memberIds: string[]): Promise<Room>;
    findById(roomId: string): Promise<Room>;
    findByUserId(userId: string): Promise<Room[]>;
}

export class RoomServices implements IRoomServices {
    userServices: IUserServices;

    constructor(userServices: IUserServices = new UserServices()) {
        this.userServices = userServices;
    }

    async findByIds(ids: string[]): Promise<Room[]> {
        if (ids.length === 0) return [];
        const { chunkedExpressionAttributeValues, chunkedFilterExpression } = chunkDBQueryIDsInOperator(ids);

        const params: DocumentClient.QueryInput = {
            TableName: ENV.MAIN_TABLE,
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
        const rooms = plainToInstance(Room, result.Items, {
            excludeExtraneousValues: true,
        });
        return rooms;
    }

    async findAll(): Promise<Room[]> {
        const params: DocumentClient.ScanInput = {
            TableName: ENV.MAIN_TABLE,
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
        const rooms = plainToInstance(Room, result.Items, {
            excludeExtraneousValues: true,
        });
        return rooms;
    }

    async create(
        owner: string,
        members: string[],
        type: 'GROUP' | 'PRIVATE',
    ): Promise<{ room: Room; isExisted: boolean }> {
        await validateSchema(NewRoomSchema, { owner, members, type });
        const now = new Date().getTime();
        const room = plainToInstance(Room, {
            roomId: uuidv4(),
            owner,
            members,
            type: type === 'GROUP' ? 'GROUP_ROOM' : 'PRIVATE_ROOM',
            createdAt: now,
            updatedAt: now,
        });

        const users = await this.userServices.findByIds(members);
        if (users.length !== members.length) throw new BadRequestException('User not found');

        if (type === 'PRIVATE') {
            const result = await this.createPrivate(room);
            return {
                ...result,
            };
        } else {
            const result = await this.createGroup(room);
            return { room: result, isExisted: false };
        }
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
                                gsi1pk: `ROOMS`,
                                gsi1sk: `UPDATED_AT#${room.updatedAt}`,
                                ...room,
                            },
                        },
                    },
                    ...[...room.members].map((userId) => ({
                        PutRequest: {
                            Item: {
                                pk: `ROOM#${room.roomId}`,
                                sk: `MEMBER#${userId}`,
                                gsi1pk: `MEMBER#${userId}`,
                                gsi1sk: `ROOM#${room.roomId}`,
                                roomId: room.roomId,
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

    async createPrivate(room: Room): Promise<{ room: Room; isExisted: boolean }> {
        if (room.members.length !== 2) throw new BadRequestException('Private room can only have 2 users');
        const roomExisted = await this.findPrivate(room.members);
        if (roomExisted) return { room: roomExisted, isExisted: true };

        const params: DocumentClient.BatchWriteItemInput = {
            RequestItems: {
                MAIN_TABLE: [
                    {
                        PutRequest: {
                            Item: {
                                pk: `ROOM#${room.roomId}`,
                                sk: `META`,
                                gsi1pk: `ROOMS`,
                                gsi1sk: `UPDATED_AT#${room.updatedAt}`,
                                ...room,
                            },
                        },
                    },
                    {
                        PutRequest: {
                            Item: {
                                pk: `ROOM#${room.roomId}`,
                                sk: `MEMBER#${room.members[0]}`,
                                gsi1pk: `MEMBER#${room.members[0]}`,
                                gsi1sk: `ROOM#${room.roomId}`,
                            },
                        },
                    },
                    {
                        PutRequest: {
                            Item: {
                                pk: `ROOM#${room.roomId}`,
                                sk: `MEMBER#${room.members[1]}`,
                                gsi1pk: `MEMBER#${room.members[1]}`,
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
                            },
                        },
                    },
                    {
                        PutRequest: {
                            Item: {
                                pk: `PRIVATE_ROOM#${room.members[1]}`,
                                sk: `PRIVATE_ROOM#${room.members[0]}`,
                                roomId: room.roomId,
                            },
                        },
                    },
                ],
            },
        };

        await DBClient.batchWrite(params).promise();

        return { room, isExisted: false };
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
        const room = plainToInstance(Room, result.Responses.MAIN_TABLE[0], {
            excludeExtraneousValues: true,
        });
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
        if (!room) throw new NotFoundException('Room not found');
        return room;
    }

    async findByUserId(userId: string): Promise<Room[]> {
        const params: DocumentClient.QueryInput = {
            TableName: 'MAIN_TABLE',
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
}
