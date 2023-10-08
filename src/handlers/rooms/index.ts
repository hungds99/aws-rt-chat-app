import BaseRoomService from '@services/room';
import BaseWsService from '@services/ws';
import { wrapperHandler } from '@utils/lambda';

const wsService = new BaseWsService();
const roomService = new BaseRoomService();

export const getRooms = wrapperHandler(async (event: any) => {
  const {
    authorizer: { userId },
  } = event.requestContext;
  const rooms = await roomService.findAllByUserId(userId);
  return rooms;
});

// export const getRoom = wrapperHandler(async (event: any) => {
//   const {
//     authorizer: { userId },
//   } = event.requestContext;
//   const { id } = event.pathParameters;
//   const room = await roomServices.findById(id);
//   // Check if user is a member of the room
//   if (room.members.indexOf(userId) === -1) {
//     throw new NotFoundException('Room not found');
//   }
//   return room;
// });

// export const getMessages = wrapperHandler(async (event: any) => {
//   const { id } = event.pathParameters;
//   const messages = await messageServices.findByRoomId(id);
//   return messages;
// });

export const wsOnCreateRoom = wrapperHandler(async (event: any, context: any) => {
  console.log('wsOnCreateRoom');
  // const {
  //     authorizer: { userId },
  // } = event.requestContext;
  const {
    room: { ownerId, memberIds },
  } = JSON.parse(event.body);

  const room = await wsService.createRoom(ownerId, memberIds);

  return {
    status: 'ROOM_CREATED',
    room: room,
  };
});

// export const wsOnCreateMessage = wrapperHandler(async (event: any, context: any) => {
//   // const {
//   //     authorizer: { userId },
//   // } = event.requestContext;
//   const { roomId, content, userId } = JSON.parse(event.body);

//   const room = await roomServices.findById(roomId);
//   const message = await messageServices.create(roomId, userId, content);

//   // Send message to all members
//   const users = await userServices.findByIds(room.members);
//   const clients = [];
//   users.forEach((user: User) => {
//     if (user.connectionId) {
//       clients.push({
//         connectionId: user.connectionId,
//         payload: {
//           action: user.connectionId === userId ? 'createdMessage' : 'receivedMessage',
//           data: message,
//         },
//       });
//     }
//   });
//   await apiGWsendMessageToClients(clients);

//   return { roomId, message };
// });
