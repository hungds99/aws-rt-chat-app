import { BadRequestException } from '@common/exceptions';
import { WrapperHandler } from '../../common/wrapper-handler';
import { UserServices } from '../users/user.service';

const userServices = new UserServices();

export const wsOnConnect = WrapperHandler(async (event: any) => {
    const { connectionId } = event.requestContext;
    console.log(`Connection ${connectionId} has been established...`);
});

export const wsAuth = WrapperHandler(async (event: any) => {
    const { connectionId } = event.requestContext;
    const { data } = JSON.parse(event.body);
    if (!data) throw new BadRequestException('No data provided');
    const user = await userServices.findById(data.id);
    await userServices.updateConnectionId(user.id, connectionId);
    return { ...user, connectionId };
});

export const wsOnDisconnect = WrapperHandler(async (event: any) => {
    const { connectionId } = event.requestContext;
    const user = await userServices.findByConnectionId(connectionId);
    await userServices.updateConnectionId(user.id);
    console.log(`Connection ${connectionId} of ${user.id} has been closed...`);
});

export const wsDefault = WrapperHandler((event: any) => {
    const connectionId = event.requestContext.connectionId;
    return {
        statusCode: 200,
        body: `${connectionId} are default!`,
    };
});
