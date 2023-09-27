import { ApiGatewayManagementApi } from 'aws-sdk';
import { CONSTANTS } from '../common/constants';
import { ENV } from '../common/environment';
import { InternalServerError } from '../common/exceptions';

const apigatewaymanagementapi = new ApiGatewayManagementApi({
  apiVersion: ENV.WS_API_VERSION,
  endpoint: ENV.WS_HOST,
});

export const getAvatar = (createdAt: string): string => {
  const sprites = ['adventurer', 'avataaars', 'big-ears', 'big-smile', 'croodles', 'micah'];
  const sprite = sprites[Math.floor(Math.random() * sprites.length)];
  return `https://avatars.dicebear.com/api/${sprite}/${createdAt}.svg`;
};

export const apiGWsendMessageToClients = async (connectionIds: string[], payload: any) => {
  try {
    await Promise.all(
      connectionIds.map((connectionId: string) => {
        const params: ApiGatewayManagementApi.PostToConnectionRequest = {
          ConnectionId: connectionId,
          Data: JSON.stringify(payload),
        };
        return apigatewaymanagementapi.postToConnection(params).promise();
      }),
    );
  } catch (error) {
    throw new InternalServerError(error);
  }
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    const chunk: T[] = array.slice(i, i + size);
    result.push(chunk);
  }
  return result;
};

export const chunkDBQueryIDsInOperator = (
  ids: string[],
): {
  chunkedExpressionAttributeValues: { [key: string]: any };
  chunkedFilterExpression: string;
} => {
  const chunkedExpressionAttributeValues: { [key: string]: any } = {};
  const filterExpression: string[] = [];
  const chunkedIds: string[][] = chunk<string>(ids, CONSTANTS.DB_IN_OPERATIONS_LIMIT);
  chunkedIds.forEach((chunkedIds: string[]) => {
    const filter = [];
    chunkedIds.forEach((id: string) => {
      chunkedExpressionAttributeValues[`:${id}`] = id;
      filter.push(`:${id}`);
    });
    filterExpression.push(`#id IN (${filter.join(',')})`);
  });
  return {
    chunkedExpressionAttributeValues,
    chunkedFilterExpression: filterExpression.join(' OR '),
  };
};
