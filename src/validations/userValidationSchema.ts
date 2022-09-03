import { ValidationSchema } from 'class-validator';

export const UserValidationSchema: ValidationSchema = {
    name: 'UserValidationSchema',
    properties: {
        userId: [
            {
                type: 'minLength',
                constraints: [1],
            },
        ],
    },
};
