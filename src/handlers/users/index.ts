import { UserServices } from '../../services/users';

const userServices = new UserServices();
export const handler = async () => {
    try {
        const users = await userServices.findAll();
        return {
            statusCode: 200,
            body: JSON.stringify({
                users,
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not get users' }),
        };
    }
};
