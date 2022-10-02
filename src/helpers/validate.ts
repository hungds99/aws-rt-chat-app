import * as Joi from 'joi';
import { BadRequestException, InternalServerError } from '../common/exceptions';

export const validateSchema = async (
    joiSchema: Joi.ObjectSchema<any>,
    value: any,
    options?: Joi.AsyncValidationOptions,
) => {
    try {
        await joiSchema.validateAsync(value, {
            abortEarly: false,
            ...options,
        });
    } catch (error: Joi.ValidationError | any) {
        if (error.isJoi) {
            const errors = error.details.map((detail: Joi.ValidationErrorItem) => detail.message);
            throw new BadRequestException(errors);
        }
        throw new InternalServerError(error);
    }
};
