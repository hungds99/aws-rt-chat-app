import { WrapperHandler } from '../../common/wrapper-handler';
import { apiGWsendMessageToClients } from '../../helpers/utils';
import { UserServices } from '../users/user.service';
import { MessageServices } from './messages/message.service';
import { RoomServices } from './room.service';

const roomServices = new RoomServices();
const messageServices = new MessageServices();
const userServices = new UserServices();

export const getRooms = WrapperHandler(async (event: any) => {
    const users = await roomServices.findAll();
    return users;
});

export const getRoom = WrapperHandler(async (event: any) => {
    const { id } = event.pathParameters;
    const room = await roomServices.findById(id);
    return room;
});

export const getMessages = WrapperHandler(async (event: any) => {
    const { id } = event.pathParameters;
    const messages = await messageServices.findByRoomId(id);
    return messages;
});

export const wsOnCreateRoom = WrapperHandler(async (event: any, context: any) => {
    const {
        connectionId,
        authorizer: { userId },
    } = event.requestContext;
    const {
        room: { members },
    } = JSON.parse(event.body);

    const newRoom = await roomServices.create(
        connectionId,
        userId,
        [...new Set<string>([...members, userId])],
        'PRIVATE',
    );

    const users = await userServices.findByIds(newRoom.members);

    // Send message to all members
    const connectionIds = users.map((user) => user.connectionId).filter((id) => id);
    await apiGWsendMessageToClients(connectionIds, { room: newRoom, users });
});
