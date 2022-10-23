import { WrapperHandler } from '../../common/wrapper-handler';
import { JWTIAMPolicy } from '../../helpers/auth';
import { AuthServices } from './auth.service';

const authServices = new AuthServices();

export const login = WrapperHandler(async (event: any) => {
    const { email, password } = JSON.parse(event.body);
    const user = await authServices.login(email, password);
    return user;
});

export const register = WrapperHandler(async (event: any) => {
    const { firstName, lastName, email, password } = JSON.parse(event.body);
    const user = await authServices.register({ firstName, lastName, email, password });
    return user;
});

export const authorizer = async (event: any) => {
    const { authorizationToken } = event;
    console.log(event);
    // Get token from header with format: Bearer <token> [RestAPI vs WebSocket]
    const bearerToken = authorizationToken ? authorizationToken.split(' ')[1] : event?.headers?.authorizationToken;
    try {
        const user = await authServices.authorizer(bearerToken);
        return JWTIAMPolicy(user.id, 'Allow', event.methodArn, { ...user });
    } catch (error) {
        console.warn('Error authorizing user : ', error);
        return JWTIAMPolicy('ERROR', 'Block', event.methodArn);
    }
};
