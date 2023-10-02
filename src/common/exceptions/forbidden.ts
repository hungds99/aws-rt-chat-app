import { HttpStatus } from '@common/enums/http-status';
import { HttpException } from './http-exception';

export class ForbiddenException extends HttpException {
  constructor(error?: any) {
    super();
    this.code = HttpStatus.FORBIDDEN;
    this.error = error;
  }
}
