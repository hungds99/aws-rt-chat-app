import Joi from 'joi';

export const UpdateUserSchema: Joi.ObjectSchema<any> = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});
