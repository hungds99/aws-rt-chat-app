import * as Joi from 'joi';

export const RegisterUserSchema: Joi.ObjectSchema<any> = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

export const LoginUserSchema: Joi.ObjectSchema<any> = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});
