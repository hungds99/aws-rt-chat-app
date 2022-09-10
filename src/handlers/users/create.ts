import { WrapperHandler } from '../../common/wrapper-handler';
import { UserServices } from '../../services/users';

export const handler = WrapperHandler(async (event: any) => {
    const userServices = new UserServices();

    const { userName, email } = JSON.parse(event.body);
    const user = await userServices.create(userName, email);
    return user;
});
