import { HTTPCode } from './constants';
import { BaseError } from './exceptions';

export interface BaseResponse {
    code: number;
    data?: any;
    error?: any;
}

export class BaseResponse implements BaseResponse {
    toResponse = () => {
        return {
            statusCode: this.code,
            body: JSON.stringify({
                code: this.code,
                data: this.data,
                error: this.error,
            }),
        };
    };

    static toSuccessResponse = (data: any) => {
        const response = new BaseResponse();
        response.code = HTTPCode.OK;
        response.data = data;
        return response.toResponse();
    };

    static toErrorResponse = (error: Error | BaseError) => {
        const errorResponse = new BaseResponse();
        errorResponse.code = error instanceof BaseError ? error.code : HTTPCode.INTERNAL_SERVER_ERROR;
        errorResponse.error = error instanceof BaseError ? error.error : 'Something wrong. Please try later';
        return errorResponse.toResponse();
    };
}
