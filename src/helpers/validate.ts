import * as Joi from 'joi';
import { BadRequest } from '../common/exceptions';

export const validate = async (joiSchema: Joi.ObjectSchema<any>, value: any, options?: Joi.AsyncValidationOptions) => {
    try {
        await joiSchema.validateAsync(value, {
            abortEarly: false,
            ...options,
        });
    } catch (error: Joi.ValidationError | any) {
        if (error.isJoi) {
            const errors = error.details.map((detail: Joi.ValidationErrorItem) => detail.message);
            throw new BadRequest(errors);
        }
        throw new Error(error);
    }
};
