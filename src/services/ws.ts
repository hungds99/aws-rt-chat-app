import { ForbiddenException } from '@common/exceptions';
import { Message } from '@models/message';
import { Room } from '@models/room';
import { User } from '@models/user';
import BaseRoomRepository from '@repositories/room';
import { BaseUserRepository } from '@repositories/user';
import { apiGWsendMessageToClients } from '@utils/apigateway';
import BaseMessageService from './message';
import BaseRoomService from './room';
import BaseUserService from './user';

type NewMessage = {
  roomId: string;
  userId: string;
  content: string;
};

interface WsService {
  createUserConnection(userId: string, connectionId: string): Promise<User>;
  removeUserConnection(connectionId: string): Promise<User>;
  createRoom(userId: string, memberIds: string[]): Promise<Room>;
  createMessage(newMessage: NewMessage): Promise<Message>;
}

export default class BaseWsService implements WsService {
  private readonly userRepository: BaseUserRepository;
  private readonly userService: BaseUserService;
  private readonly roomRepository: BaseRoomRepository;
  private readonly roomService: BaseRoomService;
  private readonly messageService: BaseMessageService;

  constructor() {
    this.userRepository = new BaseUserRepository();
    this.userService = new BaseUserService();
    this.roomRepository = new BaseRoomRepository();
    this.roomService = new BaseRoomService();
    this.messageService = new BaseMessageService();
  }

  async createUserConnection(userId: string, connectionId: string): Promise<User> {
    const user = await this.userRepository.getById(userId);
    user.connectionId = connectionId;
    const updatedUser = await this.userService.updateConnection(user.id, user.connectionId);
    return updatedUser;
  }

  async removeUserConnection(connectionId: string): Promise<User> {
    const user = await this.userRepository.findByConnectionId(connectionId);
    user.connectionId = null;
    await this.userService.updateConnection(user.id, user.connectionId);
    return user;
  }

  async createRoom(userId: string, memberIds: string[]): Promise<Room> {
    const { room, isExisted } = await this.roomService.create(userId, [
      ...new Set(memberIds),
      userId,
    ]);

    if (isExisted) {
      return room;
    }

    // Send message to all members
    const users = await this.userRepository.findByIds(room.memberIds);
    const clients = [];
    users.forEach((user: User) => {
      if (user.id !== userId && user.connectionId) {
        clients.push({
          connectionId: user.connectionId,
          payload: {
            status: 'ROOM_JOINED',
            data: room,
          },
        });
      }
    });

    await apiGWsendMessageToClients(clients);

    return room;
  }

  async createMessage(newMessage: NewMessage): Promise<Message> {
    const { roomId, userId } = newMessage;

    const room = await this.roomRepository.getById(roomId);
    if (room.memberIds.indexOf(userId) === -1) {
      throw new ForbiddenException('You are not a member of this room');
    }

    const message = await this.messageService.create(newMessage);

    // Send message to all members
    const users = await this.userRepository.findByIds(room.memberIds);
    const clients = [];
    users.forEach((user: User) => {
      if (user.id !== userId && user.connectionId) {
        clients.push({
          connectionId: user.connectionId,
          payload: {
            status: 'MESSAGE_RECEIVED',
            data: message,
          },
        });
      }
    });
    await apiGWsendMessageToClients(clients);
    return message;
  }
}
