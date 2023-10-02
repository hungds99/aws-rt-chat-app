import { BadRequestException } from '@common/exceptions';
import BaseUserServices from '@services/user';
import { wrapperHandler } from '@utils/lambda';

const userServices = new BaseUserServices();

export const wsOnConnect = wrapperHandler(async (event: any) => {
  const { connectionId } = event.requestContext;
  console.log(`Connection ${connectionId} has been established...`);
});

export const wsAuth = wrapperHandler(async (event: any) => {
  const { connectionId } = event.requestContext;
  const { data } = JSON.parse(event.body);
  if (!data) {
    throw new BadRequestException('No data provided');
  }
  const user = await userServices.findById(data.id);
  await userServices.updateConnectionId(user.id, connectionId);
  return { ...user, connectionId };
});

export const wsOnDisconnect = wrapperHandler(async (event: any) => {
  const { connectionId } = event.requestContext;
  const user = await userServices.findByConnectionId(connectionId);
  await userServices.updateConnectionId(user.id);
  console.log(`Connection ${connectionId} of ${user.id} has been closed...`);
});

export const wsDefault = wrapperHandler((event: any) => {
  const connectionId = event.requestContext.connectionId;
  return {
    statusCode: 200,
    body: `${connectionId} are default!`,
  };
});
