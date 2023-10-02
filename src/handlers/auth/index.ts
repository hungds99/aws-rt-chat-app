import BaseAuthServices from '@services/auth';
import { generateJWTIAMPolicy, getBearerToken } from '@utils/auth';
import { wrapperHandler } from '@utils/lambda';

const authServices = new BaseAuthServices();

export const login = wrapperHandler(async (event: any) => {
  const { email, password } = JSON.parse(event.body);
  const user = await authServices.login(email, password);
  return user;
});

export const register = wrapperHandler(async (event: any) => {
  const { firstName, lastName, email, password } = JSON.parse(event.body);
  const user = await authServices.register({ firstName, lastName, email, password });
  return user;
});

export const authorizer = async (event: any) => {
  try {
    const bearerToken = getBearerToken(event);
    const user = await authServices.authorizer(bearerToken);
    return generateJWTIAMPolicy(user.id, 'Allow', event.methodArn, { ...user });
  } catch (error) {
    console.warn('Error authorizing user : ', error);
    return generateJWTIAMPolicy('ERROR', 'Block', event.methodArn);
  }
};
