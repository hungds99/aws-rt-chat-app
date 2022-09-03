import { UserServices } from '../../services/users';

const userServices = new UserServices();

export const handler = async (event) => {
    const { userId } = event.pathParameters;
    try {
        const user = await userServices.findById(userId);
        return {
            statusCode: 200,
            body: JSON.stringify({ user }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not get user' }),
        };
    }
};
