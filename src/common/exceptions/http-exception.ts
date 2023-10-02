import { HttpStatus } from '@common/enums/http-status';

export class HttpException extends Error {
  code: HttpStatus;
  error: any;
}
