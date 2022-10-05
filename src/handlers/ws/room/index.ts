import { WrapperHandler } from '../../../common/wrapper-handler';
import { apiGWsendMessageToClient } from '../../../helpers/utils';
import { RoomServices } from '../../rooms/room.service';

const roomServices = new RoomServices();

export const wsOnCreateRoom = WrapperHandler(async (event: any, context: any) => {
    const connectionId = event.requestContext.connectionId;

    console.log('event 1: ', event);
    console.log('context : ', context);

    // const { owner, members } = JSON.parse(event.body);

    // const room = await roomServices.create(connectionId, owner, members, 'PRIVATE');

    // await apiGWsendMessageToClient(connectionId, {
    //     room,
    // });
    return {
        room: 'Ok 1',
    };
});
