import { Room } from '@models/room';
import { User } from '@models/user';
import { BaseUserRepository } from '@repositories/user';
import { apiGWsendMessageToClients } from '@utils/apigateway';
import BaseUserService from './user';

interface WsService {
  createUserConnection(userId: string, connectionId: string): Promise<User>;
  removeUserConnection(connectionId: string): Promise<User>;
  createRoom(ownerId: string, memberIds: string[]): Promise<Room>;
}

export default class BaseWsService implements WsService {
  // private readonly roomService: BaseRoomService;
  private readonly userRepository: BaseUserRepository;
  private readonly userService: BaseUserService;

  constructor() {
    // this.roomService = new BaseRoomService();
    this.userRepository = new BaseUserRepository();
    this.userService = new BaseUserService();
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

  async createRoom(ownerId: string, memberIds: string[]): Promise<Room> {
    const { room, isExisted } = await this.roomService.create(ownerId, [
      ...new Set(memberIds),
      ownerId,
    ]);

    if (isExisted) {
      return room;
    }

    // Send message to all members
    const users = await this.userRepository.findByIds(room.memberIds);
    const clients = [];
    users.forEach((user: User) => {
      if (user.id !== ownerId && user.connectionId) {
        clients.push({
          connectionId: user.connectionId,
          payload: {
            status: 'ROOM_JOINED',
            room: room,
          },
        });
      }
    });

    await apiGWsendMessageToClients(clients);

    return room;
  }
}
