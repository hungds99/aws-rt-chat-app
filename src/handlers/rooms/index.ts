import { NotFoundException } from '@common/exceptions';
import { User } from '@models/user';
import BaseMessageServices from '@services/message';
import BaseRoomServices from '@services/room';
import BaseUserServices from '@services/user';
import { apiGWsendMessageToClients } from '@utils/apigateway';
import { wrapperHandler } from '@utils/lambda';

const roomServices = new BaseRoomServices();
const messageServices = new BaseMessageServices();
const userServices = new BaseUserServices();

export const getRooms = wrapperHandler(async (event: any) => {
  const {
    authorizer: { userId },
  } = event.requestContext;
  const rooms = await roomServices.findByUserId(userId);
  return rooms;
});

export const getRoom = wrapperHandler(async (event: any) => {
  const {
    authorizer: { userId },
  } = event.requestContext;
  const { id } = event.pathParameters;
  const room = await roomServices.findById(id);
  // Check if user is a member of the room
  if (room.members.indexOf(userId) === -1) {
    throw new NotFoundException('Room not found');
  }
  return room;
});

export const getMessages = wrapperHandler(async (event: any) => {
  const { id } = event.pathParameters;
  const messages = await messageServices.findByRoomId(id);
  return messages;
});

export const wsOnCreateRoom = wrapperHandler(async (event: any, context: any) => {
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
  if (isExisted) {
    return room;
  }

  const users = await userServices.findByIds(room.members);
  // Send message to all members
  const clients = [];
  users.forEach((user: User) => {
    if (user.connectionId !== userId && user.connectionId) {
      clients.push({
        connectionId: user.connectionId,
        payload: {
          action: 'joinedRoom',
          data: room,
        },
      });
    }
  });

  await apiGWsendMessageToClients(clients);
  return room;
});

export const wsOnCreateMessage = wrapperHandler(async (event: any, context: any) => {
  // const {
  //     authorizer: { userId },
  // } = event.requestContext;
  const { roomId, content, userId } = JSON.parse(event.body);

  const room = await roomServices.findById(roomId);
  const message = await messageServices.create(roomId, userId, content);

  // Send message to all members
  const users = await userServices.findByIds(room.members);
  const clients = [];
  users.forEach((user: User) => {
    if (user.connectionId) {
      clients.push({
        connectionId: user.connectionId,
        payload: {
          action: user.connectionId === userId ? 'createdMessage' : 'receivedMessage',
          data: message,
        },
      });
    }
  });
  await apiGWsendMessageToClients(clients);

  return { roomId, message };
});
