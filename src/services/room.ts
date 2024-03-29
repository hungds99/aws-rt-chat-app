import { BadRequestException } from '@common/exceptions';
import getCurrentTime from '@libs/getCurrentTime';
import { Room } from '@models/room';
import BaseRoomRepository from '@repositories/room';
import { BaseUserRepository } from '@repositories/user';
import { validateSchema } from '@utils/validation';
import { NewRoomSchema } from '@validations/room';
import { plainToClass } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

interface RoomService {
  create(userId: string, memberIds: string[]): Promise<{ room: Room; isExisted: boolean }>;
  findAllByUserId(userId: string): Promise<Room[] | []>;
  getByIdWithUserId(id: string, userId: string): Promise<Room>;
}

export default class BaseRoomService implements RoomService {
  private readonly roomRepository: BaseRoomRepository;
  private readonly userRepository: BaseUserRepository;

  constructor() {
    this.roomRepository = new BaseRoomRepository();
    this.userRepository = new BaseUserRepository();
  }

  async create(userId: string, memberIds: string[]): Promise<{ room: Room; isExisted: boolean }> {
    await validateSchema(NewRoomSchema, { userId, memberIds });

    const users = await this.userRepository.findByIds(memberIds);
    if (users.length !== memberIds.length) {
      throw new BadRequestException('Members are invalid');
    }

    const isGroupRoom = memberIds.length > 2;

    const now = getCurrentTime();
    const room = plainToClass(Room, {
      id: uuidv4(),
      userId: userId,
      memberIds: memberIds,
      type: isGroupRoom ? 'GROUP_ROOM' : 'PRIVATE_ROOM',
      createdAt: now,
      updatedAt: now,
    });

    const result = {
      room: null,
      isExisted: false,
    };

    if (isGroupRoom) {
      result.room = await this.roomRepository.createGroup(room);
    } else {
      const existedRoom = await this.roomRepository.findPrivate(room.memberIds);
      if (existedRoom) {
        result.room = existedRoom;
        result.isExisted = true;
      } else {
        result.room = await this.roomRepository.createPrivate(room);
      }
    }

    return result;
  }

  async findAllByUserId(userId: string): Promise<Room[] | []> {
    const rooms = await this.roomRepository.findAllByUserId(userId);
    return rooms;
  }

  async getByIdWithUserId(id: string, userId: string): Promise<Room> {
    const room = await this.roomRepository.getById(id);

    // Check if user is a member of the room
    if (room.memberIds.indexOf(userId) === -1) {
      throw new BadRequestException('Room not found');
    }

    return room;
  }
}
