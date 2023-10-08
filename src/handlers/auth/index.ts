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

export const authorizer = async (event, context, callback) => {
  try {
    const bearerToken = getBearerToken(event);
    const user = await authService.authorizer(bearerToken);
    const allowPolicy = generateJWTIAMPolicy(user.id, 'Allow', event.routeArn, { ...user });
    console.log('allowPolicy', { ...allowPolicy }, allowPolicy.policyDocument);
    return callback(null, allowPolicy);
  } catch (error) {
    console.warn('Error authorizing user : ', error);
    const denyPolicy = generateJWTIAMPolicy('ERROR', 'Deny', event.routeArn);
    return callback(null, denyPolicy);
  }
};
