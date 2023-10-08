import BaseWsService from '@services/ws';
import { wrapperHandler } from '@utils/lambda';

const wsService = new BaseWsService();

export const wsOnConnect = wrapperHandler(async (event: any) => {
  const { connectionId } = event.requestContext;
  console.log(`Connection ${connectionId} has been established...`);
});

export const wsAuth = wrapperHandler(async (event: any) => {
  const { connectionId } = event.requestContext;
  const { data } = JSON.parse(event.body);
  const user = await wsService.createUserConnection(data.userId, connectionId);
  return { status: 'AUTHENTICATED', user };
});

export const wsOnDisconnect = wrapperHandler(async (event: any) => {
  const { connectionId } = event.requestContext;
  const user = await wsService.removeUserConnection(connectionId);
  console.log(`Connection ${connectionId} of ${user.id} has been closed...`);
});

export const wsDefault = wrapperHandler((event: any) => {
  const connectionId = event.requestContext.connectionId;
  return {
    statusCode: 200,
    body: `${connectionId} are default!`,
  };
});
