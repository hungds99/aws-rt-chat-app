import { HTTPCode } from './constants';

export class BaseError extends Error {
    code: number;
}

// General exception errors
export class BadRequest extends BaseError {
    constructor(message: string) {
        super(message);
        this.code = HTTPCode.BAD_REQUEST;
    }
}

export class Unauthorized extends BaseError {
    constructor(message: string) {
        super(message);
        this.code = HTTPCode.UNAUTHORIZED;
    }
}

export class Forbidden extends BaseError {
    constructor(message: string) {
        super(message);
        this.code = HTTPCode.FORBIDDEN;
    }
}

export class NotFound extends BaseError {
    constructor(message: string) {
        super(message);
        this.code = HTTPCode.NOT_FOUND;
    }
}

export class InternalServerError extends BaseError {
    constructor(message: string) {
        super(message);
        this.code = HTTPCode.INTERNAL_SERVER_ERROR;
    }
}

export class CustomError extends BaseError {
    constructor(message: string, code: number) {
        super(message);
        this.code = code;
    }
}
