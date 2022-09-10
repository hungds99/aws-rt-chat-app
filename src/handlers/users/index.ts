import { WrapperHandler } from '../../common/wrapper-handler';
import { UserServices } from '../../services/users';

export const handler = WrapperHandler(async (event: any) => {
    const userServices = new UserServices();
    const users = await userServices.findAll();
    return users;
});
