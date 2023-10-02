import { HttpStatus } from '@common/enums/http-status';
import { HttpException } from './http-exception';

export class CustomException extends HttpException {
  constructor(code: HttpStatus, error?: any) {
    super();
    this.code = code;
    this.error = error;
  }
}
