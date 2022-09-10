import { WrapperHandler } from '../../common/wrapper-handler';
import { UserServices } from './user.service';

const userServices = new UserServices();

export const getUsers = WrapperHandler(async (event: any) => {
    const users = await userServices.findAll();
    return users;
});

export const createUser = WrapperHandler(async (event: any) => {
    const { username, email } = JSON.parse(event.body);
    const user = await userServices.create(username, email);
    return user;
});

export const getUser = WrapperHandler(async (event: any) => {
    const { id } = event.pathParameters;
    const user = await userServices.findById(id);
    return user;
});
