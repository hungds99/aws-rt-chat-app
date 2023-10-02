import { HttpStatus } from '@common/enums/http-status';
import { HttpException } from './http-exception';

export class InternalServerException extends HttpException {
  constructor(error?: any) {
    super();
    this.code = HttpStatus.INTERNAL_SERVER_ERROR;
    this.error = error;
  }
}
