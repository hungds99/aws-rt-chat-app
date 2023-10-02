import { HttpStatus } from '@common/enums/http-status';
import { HttpException } from './http-exception';

export class BadRequestException extends HttpException {
  constructor(error?: any) {
    super();
    this.code = HttpStatus.BAD_REQUEST;
    this.error = error;
  }
}
