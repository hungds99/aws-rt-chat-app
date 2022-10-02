import * as Joi from 'joi';

export const NewRoomSchema: Joi.ObjectSchema<any> = Joi.object({
    owner: Joi.string().required(),
    type: Joi.string().valid('GROUP', 'PRIVATE').required(),
    members: Joi.array()
        .min(2)
        .when('type', {
            is: 'PRIVATE',
            then: Joi.array().max(2).required(), // only 2 users allowed in private room
        })
        .when('type', {
            is: 'GROUP',
            then: Joi.array().max(10).required(), // only 10 users allowed in group room
        })
        .items(Joi.string())
        .required(),
});
