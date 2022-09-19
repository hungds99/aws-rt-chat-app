import { WrapperHandler } from '../../common/wrapper-handler';
import { RoomServices } from './room.service';

const roomServices = new RoomServices();

export const createRoom = WrapperHandler(async (event: any) => {
    // TODO: Check if the user is authenticated

    const { createdBy, roomType, userIds } = JSON.parse(event.body);

    const room = await roomServices.create(createdBy, userIds, roomType);
    return room;
});
