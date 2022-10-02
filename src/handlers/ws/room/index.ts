import { WrapperHandler } from '../../../common/wrapper-handler';
import { apiGWsendMessageToClient } from '../../../helpers/utils';
import { RoomServices } from '../../rooms/room.service';

const roomServices = new RoomServices();

export const wsOnCreateRoom = WrapperHandler(async (event: any) => {
    const connectionId = event.requestContext.connectionId;

    const { owner, members } = JSON.parse(event.body);

    const room = await roomServices.create(connectionId, owner, members, 'PRIVATE');

    await apiGWsendMessageToClient(connectionId, {
        room,
    });
    return room;
});
