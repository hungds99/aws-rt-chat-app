import { UserServices } from '../../services/users';

const userServices = new UserServices();
export const handler = async (event) => {
    const { userName, email } = JSON.parse(event.body);
    try {
        const user = await userServices.create(userName, email);
        return {
            statusCode: 200,
            body: JSON.stringify({ user }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error instanceof Error ? error.message : 'Internal server error',
            }),
        };
    }
};
