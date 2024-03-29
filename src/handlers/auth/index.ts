import BaseAuthService from '@services/auth';
import { generateJWTIAMPolicy, getBearerToken } from '@utils/auth';
import { wrapperHandler } from '@utils/lambda';

const authService = new BaseAuthService();

export const login = wrapperHandler(async (event: any) => {
  const { email, password } = JSON.parse(event.body);
  const user = await authService.login(email, password);
  return user;
});

export const register = wrapperHandler(async (event: any) => {
  const { firstName, lastName, email, password } = JSON.parse(event.body);
  const user = await authService.register({ firstName, lastName, email, password });
  return user;
});

export const authorizer = async (event: any) => {
  try {
    const bearerToken = getBearerToken(event);
    const user = await authService.authorizer(bearerToken);
    return generateJWTIAMPolicy(user.id, 'Allow', event.routeArn, { ...user });
  } catch (error) {
    console.warn('Error authorizing user : ', error);
    return generateJWTIAMPolicy('ERROR', 'Deny', event.routeArn);
  }
};
