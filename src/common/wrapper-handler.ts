import { BaseResponse } from './response';

export const WrapperHandler = (handler: any) => {
    return async (event: any, context: any) => {
        try {
            const response = await handler(event, context);
            return BaseResponse.toSuccessResponse(response);
        } catch (error) {
            return BaseResponse.toErrorResponse(error);
        }
    };
};
