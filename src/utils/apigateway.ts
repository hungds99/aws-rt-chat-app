import { getEnv } from '@common/configs';
import { InternalServerException } from '@common/exceptions';
import { ApiGatewayManagementApi } from 'aws-sdk';

const apigatewaymanagementapi = new ApiGatewayManagementApi({
  apiVersion: getEnv().WS_API_VERSION,
  endpoint: getEnv().WS_HOST,
});

export const apiGWsendMessageToClients = async (
  clients: {
    connectionId: string;
    payload: Record<string, any>;
  }[],
) => {
  try {
    const result = await Promise.allSettled(
      clients.map((client: { connectionId: string; payload: Record<string, any> }) => {
        const params: ApiGatewayManagementApi.PostToConnectionRequest = {
          ConnectionId: client.connectionId,
          Data: JSON.stringify(client.payload),
        };
        return apigatewaymanagementapi.postToConnection(params).promise();
      }),
    );
    console.log('result: ', result);
  } catch (error) {
    console.log('error: ', error);
    throw new InternalServerException(error);
  }
};
