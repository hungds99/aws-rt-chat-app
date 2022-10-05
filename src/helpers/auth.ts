import * as jwt from 'jsonwebtoken';
import { ENV } from '../common/environment';
import { User } from '../handlers/users/user.model';

export const generateJWT = (payload: string | object | Buffer, options: jwt.SignOptions): string => {
    const secretOrPrivateKey: jwt.Secret = ENV.JWT_SECRET_KEY;
    const token = jwt.sign(payload, secretOrPrivateKey, {
        ...options,
    });
    return token;
};

export const verifyJWT = (token: string): Promise<any> => {
    const secretOrPrivateKey: jwt.Secret = ENV.JWT_SECRET_KEY;
    return new Promise((resolve, reject) => {
        jwt.verify(token, secretOrPrivateKey, (error, decoded) => {
            if (error) {
                reject(error);
            }
            resolve(decoded);
        });
    });
};

export const JWTIAMPolicy = (principalId: string, effect: 'Allow' | 'Block', resource: string, user?: User) => {
    console.info(`principalId: ${principalId}, effect: ${effect}, resource: ${resource}`);
    return {
        principalId: principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
            ],
        },
        context: {
            userId: user?.userId,
            email: user?.email,
        },
    };
};
