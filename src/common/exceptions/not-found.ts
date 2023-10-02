import { HttpStatus } from '@common/enums/http-status';
import { HttpException } from './http-exception';

export class NotFoundException extends HttpException {
  constructor(error?: any) {
    super();
    this.code = HttpStatus.NOT_FOUND;
    this.error = error;
  }
}
