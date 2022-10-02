import { WrapperHandler } from '../../common/wrapper-handler';

export const wsOnConnect = WrapperHandler(async (event: any) => {
    const connectionId = event.requestContext.connectionId;
    return {
        statusCode: 200,
        body: `${connectionId} are connected!`,
    };
});

export const wsOnDisconnect = WrapperHandler(async (event: any) => {
    const connectionId = event.requestContext.connectionId;
    return {
        statusCode: 200,
        body: `${connectionId} are disconnected!`,
    };
});

export const wsDefault = WrapperHandler((event: any) => {
    const connectionId = event.requestContext.connectionId;
    return {
        statusCode: 200,
        body: `${connectionId} are default!`,
    };
});
