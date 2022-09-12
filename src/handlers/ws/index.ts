import { WrapperHandler } from '../../common/wrapper-handler';

export const wsConnect = WrapperHandler((event: any) => {
    const connectionId = event.requestContext.connectionId;
    console.log('Connected: ', connectionId);
    return {
        statusCode: 200,
        body: `${connectionId} are connected!`,
    };
});

export const wsDisconnect = WrapperHandler((event: any) => {
    const connectionId = event.requestContext.connectionId;
    console.log('Disconnected: ', connectionId);
    return {
        statusCode: 200,
        body: `${connectionId} are disconnected!`,
    };
});

export const wsDefault = WrapperHandler((event: any) => {
    const connectionId = event.requestContext.connectionId;
    console.log('wsDefault: ', connectionId);
    return {
        statusCode: 200,
        body: `${connectionId} are default!`,
    };
});

export const wsMessage = WrapperHandler((event: any) => {
    const connectionId = event.requestContext.connectionId;
    console.log('wsMessage: ', connectionId);
    return {
        statusCode: 200,
        body: `${connectionId} are message!`,
    };
});
