import { ApiGatewayManagementApi } from 'aws-sdk';
import { WrapperHandler } from '../../common/wrapper-handler';

export const wsOnConnect = WrapperHandler(async (event: any) => {
    const connectionId = event.requestContext.connectionId;
    console.log('Connected: ', connectionId);
    return {
        statusCode: 200,
        body: `${connectionId} are connected!`,
    };
});

export const wsOnDisconnect = WrapperHandler(async (event: any) => {
    const connectionId = event.requestContext.connectionId;
    console.log('Disconnected: ', connectionId);
    await sendMessageToClient(connectionId, {
        message: `${connectionId} disconnected`,
    });
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

export const wsOnMessage = WrapperHandler(async (event: any) => {
    const connectionId = event.requestContext.connectionId;
    console.log('wsMessage: ', connectionId);
    await sendMessageToClient(connectionId, {
        message: 'Hello from server',
    });
    return {
        statusCode: 200,
        body: `${connectionId} are message!`,
    };
});

const sendMessageToClient = (connectionId: string, payload: any) =>
    new Promise((resolve, reject) => {
        const apigatewaymanagementapi = new ApiGatewayManagementApi({
            apiVersion: '2018-11-29',
            endpoint: 'http://localhost:3001',
        });
        apigatewaymanagementapi.postToConnection(
            {
                ConnectionId: connectionId, // connectionId of the receiving ws-client
                Data: JSON.stringify(payload),
            },
            (err, data) => {
                if (err) {
                    console.log('err is', err);
                    reject(err);
                }
                resolve(data);
            },
        );
    });
