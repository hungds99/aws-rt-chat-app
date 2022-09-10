import { WrapperHandler } from '../../common/wrapper-handler';
import { UserServices } from '../../services/users';

export const handler = WrapperHandler(async (event: any) => {
    const userServices = new UserServices();
    const { id } = event.pathParameters;
    const user = await userServices.findById(id);
    return user;
});
