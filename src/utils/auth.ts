import { getEnv } from '@common/configs';
import { User } from '@models/user';
import * as jwt from 'jsonwebtoken';

export const getBearerToken = (event: any): string => {
  const { headers } = event;

  const tokenString = headers.Authorization.split(' ')[1];

  console.log('tokenString', tokenString);

  return tokenString;
};

export const generateJWT = (
  payload: string | object | Buffer,
  options: jwt.SignOptions,
): string => {
  const secretOrPrivateKey: jwt.Secret = getEnv().JWT_SECRET_KEY;
  const token = jwt.sign(payload, secretOrPrivateKey, {
    ...options,
  });
  return token;
};

export const verifyJWT = (token: string): Promise<any> => {
  const secretOrPrivateKey: jwt.Secret = getEnv().JWT_SECRET_KEY;
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretOrPrivateKey, (error, decoded) => {
      if (error) {
        reject(error);
      }
      resolve(decoded);
    });
  });
};

export const generateJWTIAMPolicy = (
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string,
  user?: User,
) => {
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
      userId: user?.id,
      email: user?.email,
    },
  };
};
