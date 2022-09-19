import * as Joi from 'joi';

export const NewMessageSchema: Joi.ObjectSchema<any> = Joi.object({
    type: 'object',
    properties: {
        roomId: Joi.string().required(),
        createdBy: Joi.string().required(),
        content: Joi.string().required(),
    },
});
