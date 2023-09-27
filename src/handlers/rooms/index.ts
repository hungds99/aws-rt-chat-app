import { NotFoundException } from '../../common/exceptions';
import { WrapperHandler } from '../../common/wrapper-handler';
import { apiGWsendMessageToClients } from '../../helpers/utils';
import { User } from '../users/user.model';
import { UserServices } from '../users/user.service';
import { MessageServices } from './messages/message.service';
import { RoomServices } from './room.service';

const roomServices = new RoomServices();
const messageServices = new MessageServices();
const userServices = new UserServices();

export const getRooms = WrapperHandler(async (event: any) => {
  const {
    authorizer: { userId },
  } = event.requestContext;
  const rooms = await roomServices.findByUserId(userId);
  return rooms;
});

export const getRoom = WrapperHandler(async (event: any) => {
  const {
    authorizer: { userId },
  } = event.requestContext;
  const { id } = event.pathParameters;
  const room = await roomServices.findById(id);
  if (room.members.indexOf(userId) === -1) {
    throw new NotFoundException('Room not found');
  }
  return room;
});

export const getMessages = WrapperHandler(async (event: any) => {
  const { id } = event.pathParameters;
  const messages = await messageServices.findByRoomId(id);
  return messages;
});

export const wsOnCreateRoom = WrapperHandler(async (event: any, context: any) => {
  // const {
  //     authorizer: { userId },
  // } = event.requestContext;
  const {
    room: { userId, members },
  } = JSON.parse(event.body);

  const { room, isExisted } = await roomServices.create(
    userId,
    [...new Set<string>([...members, userId])],
    'PRIVATE',
  );
  if (isExisted) return room;

  const users = await userServices.findByIds(room.members);

  // Send message to all members
  const connectionIds = users
    .map((user: User) => (user.id !== userId ? user.connectionId : null))
    .filter((connectionId: string) => connectionId);
  await apiGWsendMessageToClients(connectionIds, { room: room });
  return room;
});

export const wsOnCreateMessage = WrapperHandler(async (event: any, context: any) => {
  // const {
  //     authorizer: { userId },
  // } = event.requestContext;
  const { roomId, content, userId } = JSON.parse(event.body);

  const room = await roomServices.findById(roomId);
  if (!room) throw new NotFoundException(`Room #${roomId} not found`);

  const message = await messageServices.create(roomId, userId, content);

  // Send message to all members
  const users = await userServices.findByIds(room.members);
  const connectionIds = users.map((user: User) => user.connectionId);
  await apiGWsendMessageToClients(connectionIds, { roomId, message });
  return { roomId, message };
});
