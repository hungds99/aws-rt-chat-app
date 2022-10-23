import { WrapperHandler } from '../../common/wrapper-handler';
import { UserServices } from '../users/user.service';

const userServices = new UserServices();

export const wsOnConnect = WrapperHandler(async (event: any) => {
    const {
        connectionId,
        // authorizer: { userId },
    } = event.requestContext;
    const { userId } = JSON.parse(event.body);
    await userServices.updateConnectionId(userId, connectionId);
    return {
        userId,
        connectionId,
        message: `User ${userId} connected in connection ${connectionId}`,
    };
});

export const wsOnDisconnect = WrapperHandler(async (event: any) => {
    const {
        connectionId,
        // authorizer: { userId },
    } = event.requestContext;
    const { userId } = JSON.parse(event.body);
    await userServices.updateConnectionId(userId, null);
    return {
        userId,
        connectionId,
        message: `User ${userId} disconnected in connection ${connectionId}`,
    };
});

export const wsDefault = WrapperHandler((event: any) => {
    const connectionId = event.requestContext.connectionId;
    return {
        statusCode: 200,
        body: `${connectionId} are default!`,
    };
});
