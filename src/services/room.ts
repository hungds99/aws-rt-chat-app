import { BadRequestException } from '@common/exceptions';
import { Room } from '@models/room';
import BaseRoomRepository from '@repositories/room';
import { BaseUserRepository } from '@repositories/user';
import { validateSchema } from '@utils/validation';
import { NewRoomSchema } from '@validations/room';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

interface RoomService {
  create(ownerId: string, memberIds: string[]): Promise<{ room: Room; isExisted: boolean }>;
  findAllByUserId(userId: string): Promise<Room[] | []>;
}

export default class BaseRoomService implements RoomService {
  private readonly roomRepository: BaseRoomRepository;
  private readonly userRepository: BaseUserRepository;

  constructor() {
    this.roomRepository = new BaseRoomRepository();
    this.userRepository = new BaseUserRepository();
  }

  async create(ownerId: string, memberIds: string[]): Promise<{ room: Room; isExisted: boolean }> {
    await validateSchema(NewRoomSchema, { ownerId, memberIds });

    const users = await this.userRepository.findByIds(memberIds);
    if (users.length !== memberIds.length) {
      throw new BadRequestException('Members are invalid');
    }

    const isGroupRoom = memberIds.length > 2;

    const now = new Date().getTime();
    const room = plainToInstance(Room, {
      id: uuidv4(),
      ownerId: ownerId,
      memberIds: memberIds,
      type: isGroupRoom ? 'GROUP_ROOM' : 'PRIVATE_ROOM',
      createdAt: now,
      updatedAt: now,
    });

    if (isGroupRoom) {
      const createdRoom = await this.roomRepository.createGroup(room);
      return { room: createdRoom, isExisted: false };
    } else {
      const existedRoom = await this.roomRepository.findPrivate(room.memberIds);
      if (existedRoom) {
        return { room: existedRoom, isExisted: true };
      }

      const createdRoom = await this.roomRepository.createPrivate(room);
      return { room: createdRoom, isExisted: false };
    }
  }

  async findAllByUserId(userId: string): Promise<Room[] | []> {
    const rooms = await this.roomRepository.findAllByUserId(userId);
    return rooms;
  }
}
