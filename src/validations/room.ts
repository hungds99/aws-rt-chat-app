import Joi from 'joi';

export const NewRoomSchema: Joi.ObjectSchema<any> = Joi.object({
  userId: Joi.string().required(),
  memberIds: Joi.array().min(2).max(10).items(Joi.string()).required(),
});
