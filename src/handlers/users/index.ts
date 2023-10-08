import BaseUserService from '@services/user';
import { wrapperHandler } from '@utils/lambda';

const userService = new BaseUserService();

export const getUsers = wrapperHandler(async (event: any) => {
  const users = await userService.findAll();
  return users;
});

export const getUser = wrapperHandler(async (event: any) => {
  const { id } = event.pathParameters;
  const user = await userService.findById(id);
  return user;
});
