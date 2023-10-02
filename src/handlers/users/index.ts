import BaseUserServices from '@services/user';
import { wrapperHandler } from '@utils/lambda';

const userServices = new BaseUserServices();

export const getUsers = wrapperHandler(async (event: any) => {
  const users = await userServices.findAll();
  return users;
});

export const getUser = wrapperHandler(async (event: any) => {
  const { id } = event.pathParameters;
  const user = await userServices.findById(id);
  return user;
});
