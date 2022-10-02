import * as jwt from 'jsonwebtoken';
import { ENV } from '../common/environment';

export const generateJWT = (payload: string | object | Buffer, options: jwt.SignOptions): string => {
    const secretOrPrivateKey: jwt.Secret = ENV.JWT_SECRET_KEY;
    const token = jwt.sign(payload, secretOrPrivateKey, {
        ...options,
    });
    return token;
};
