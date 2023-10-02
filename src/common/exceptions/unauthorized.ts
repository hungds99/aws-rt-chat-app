import { HttpStatus } from '@common/enums/http-status';
import { HttpException } from './http-exception';

export class UnauthorizedException extends HttpException {
  constructor(error?: any) {
    super();
    this.code = HttpStatus.UNAUTHORIZED;
    this.error = error;
  }
}
