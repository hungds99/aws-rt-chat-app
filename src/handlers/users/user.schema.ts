import * as Joi from 'joi';

export const NewUserSchema: Joi.ObjectSchema<any> = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
});
