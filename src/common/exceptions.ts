import { HTTPCode } from './constants';

export class BaseError {
    code: number;
    error: any;
}

// General exception errors
export class BadRequest extends BaseError {
    constructor(error?: any) {
        super();
        this.code = HTTPCode.BAD_REQUEST;
        this.error = error;
    }
}

export class Unauthorized extends BaseError {
    constructor(error?: any) {
        super();
        this.code = HTTPCode.UNAUTHORIZED;
        this.error = error;
    }
}

export class Forbidden extends BaseError {
    constructor(error?: any) {
        super();
        this.code = HTTPCode.FORBIDDEN;
        this.error = error;
    }
}

export class NotFound extends BaseError {
    constructor(error?: any) {
        super();
        this.code = HTTPCode.NOT_FOUND;
        this.error = error;
    }
}

export class InternalServerError extends BaseError {
    constructor(error?: any) {
        super();
        this.code = HTTPCode.INTERNAL_SERVER_ERROR;
        this.error = error;
    }
}

export class CustomError extends BaseError {
    constructor(code: number, error?: any) {
        super();
        this.code = code;
        this.error = error;
    }
}
