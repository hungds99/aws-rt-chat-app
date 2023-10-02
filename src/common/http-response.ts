import { HttpStatus } from './enums/http-status';
import { HttpException } from './exceptions/http-exception';

interface HttpResponse {
  code: number;
  data?: any;
  error?: any;
}

export class BaseHttpResponse implements HttpResponse {
  code: number;
  data?: any;
  error?: any;

  toResponse() {
    return {
      statusCode: this.code,
      body: JSON.stringify({
        code: this.code,
        data: this.data,
        error: this.error,
      }),
    };
  }

  toSuccessResponse(data: any) {
    this.code = HttpStatus.OK;
    this.data = data;
    return this.toResponse();
  }

  toErrorResponse(error: Error | HttpException) {
    this.code = error instanceof HttpException ? error.code : HttpStatus.INTERNAL_SERVER_ERROR;
    this.error =
      error instanceof HttpException
        ? this.code === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal Server Error'
          : error.error
        : 'Internal Server Error';
    console.error('Internal error: ', error);
    return this.toResponse();
  }
}
