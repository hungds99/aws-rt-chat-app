import Joi from 'joi';

export const NewMessageSchema: Joi.ObjectSchema<any> = Joi.object({
  roomId: Joi.string().required(),
  userId: Joi.string().required(),
  content: Joi.string().required(),
});
