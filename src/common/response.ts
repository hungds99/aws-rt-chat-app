import { HTTPCode } from './constants';
import { BaseError } from './exceptions';

export interface BaseResponse {
    message: string;
    code: number;
    data?: any;
}

export class BaseResponse implements BaseResponse {
    constructor(code: number, message: string, data?: any) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    toResponse = () => {
        return {
            statusCode: this.code,
            body: JSON.stringify({
                code: this.code,
                message: this.message,
                data: this.data,
            }),
        };
    };

    static toSuccessResponse = (data: any) => {
        const response = new BaseResponse(HTTPCode.OK, 'Success', data);
        return response.toResponse();
    };

    static toErrorResponse = (error: Error | BaseError) => {
        if (error instanceof BaseError) {
            return new BaseResponse(error.code, error.message).toResponse();
        }
        console.error('INTERNAL_SERVER_ERROR: ', error);
        return new BaseResponse(HTTPCode.INTERNAL_SERVER_ERROR, 'Something wrong. Please try later').toResponse();
    };
}
