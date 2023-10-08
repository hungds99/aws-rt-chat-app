import { NotFoundException } from '@common/exceptions';
import BaseMessageService from '@services/message';
import BaseRoomService from '@services/room';
import BaseWsService from '@services/ws';
import { wrapperHandler } from '@utils/lambda';

const wsService = new BaseWsService();
const roomService = new BaseRoomService();
const messageService = new BaseMessageService();

export const getRooms = wrapperHandler(async (event: any) => {
  const {
    authorizer: { userId },
  } = event.requestContext;
  const rooms = await roomService.findAllByUserId(userId);
  return rooms;
});

export const getRoom = wrapperHandler(async (event: any) => {
  const {
    authorizer: { userId },
  } = event.requestContext;
  const { id } = event.pathParameters;
  const room = await roomService.getByIdWithUserId(id, userId);
  return room;
});

export const getMessages = wrapperHandler(async (event: any) => {
  const { id } = event.pathParameters;
  const messages = await messageService.findAllByRoomId(id);
  return messages;
});

export const wsOnCreateRoom = wrapperHandler(async (event: any, context: any) => {
  // const {
  //     authorizer: { userId },
  // } = event.requestContext;
  const {
    data: { userId, memberIds },
  } = JSON.parse(event.body);

  const room = await wsService.createRoom(userId, memberIds);

  return {
    status: 'ROOM_CREATED',
    data: room,
  };
});

export const wsOnCreateMessage = wrapperHandler(async (event: any, context: any) => {
  // const {
  //     authorizer: { userId },
  // } = event.requestContext;
  const { action, data } = JSON.parse(event.body);

  const message = await wsService.createMessage(data);

  return {
    status: 'MESSAGE_CREATED',
    data: message,
  };
});
