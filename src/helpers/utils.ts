import { ApiGatewayManagementApi } from 'aws-sdk';
import { InternalServerError } from '../common/exceptions';

export const getAvatar = (username: string): string => {
    const sprites = ['adventurer', 'avataaars', 'big-ears', 'big-smile', 'croodles', 'micah'];
    const sprite = sprites[Math.floor(Math.random() * sprites.length)];
    return `https://avatars.dicebear.com/api/${sprite}/${username}.svg`;
};

export const apiGWsendMessageToClient = async (connectionId: string, payload: any) => {
    const apigatewaymanagementapi = new ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: 'http://localhost:3001',
    });
    try {
        const params: ApiGatewayManagementApi.PostToConnectionRequest = {
            ConnectionId: connectionId,
            Data: JSON.stringify(payload),
        };
        await apigatewaymanagementapi.postToConnection(params).promise();
    } catch (error) {
        throw new InternalServerError(error);
    }
};