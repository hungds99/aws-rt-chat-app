import { WrapperHandler } from '../../common/wrapper-handler';
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
