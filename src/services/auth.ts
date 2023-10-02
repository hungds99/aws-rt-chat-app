import { DBClient, getEnv } from '@common/configs';
import {
  BadRequestException,
  InternalServerException,
  UnauthorizedException,
} from '@common/exceptions';
import getAvatar from '@libs/getAvatar';
import { AuthUser, CreateUserInput, User } from '@models/user';
import { generateJWT, verifyJWT } from '@utils/auth';
import { validateSchema } from '@utils/validation';
import { LoginUserSchema, RegisterUserSchema } from '@validations/auth';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import * as bcrypt from 'bcryptjs';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import BaseUserServices from './user';

interface AuthServices {
  authorizer(token: string): Promise<User>;
  login(email: string, password: string): Promise<AuthUser>;
  register(user: CreateUserInput): Promise<User>;
}

export default class BaseAuthServices implements AuthServices {
  userServices: BaseUserServices;

  constructor(userServices: BaseUserServices = new BaseUserServices()) {
    this.userServices = userServices;
  }

  async authorizer(token: string): Promise<User> {
    const tokenDecoded = await verifyJWT(token);
    if (!tokenDecoded) {
      throw new UnauthorizedException('Invalid token');
    }
    const user = await this.userServices.findById(tokenDecoded?.id);
    return user;
  }

  async login(email: string, password: string): Promise<AuthUser> {
    await validateSchema(LoginUserSchema, { email, password });
    const user = await this.userServices.findDetailByEmail(email, true);
    if (!user || !bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException('Wrong credentials');
    try {
      const accessToken = generateJWT({ ...user, password: undefined }, { expiresIn: '1d' });
      const refreshToken = generateJWT({ ...user, password: undefined }, { expiresIn: '30d' });
      const authUser = plainToInstance(
        AuthUser,
        {
          ...user,
          accessToken,
          refreshToken,
        },
        {
          excludeExtraneousValues: true,
        },
      );
      return authUser;
    } catch (error) {
      throw new InternalServerException(error);
    }
  }

  async register(newUser: CreateUserInput): Promise<User> {
    const { email, password, firstName, lastName } = newUser;
    await validateSchema(RegisterUserSchema, { ...newUser });
    const userIdExisted = await this.userServices.findByEmail(email);
    if (userIdExisted) {
      throw new BadRequestException('User already exists');
    }

    try {
      const now = new Date().getTime();
      const passwordHashed = bcrypt.hashSync(password, 6);
      const user: User = {
        id: uuidv4(),
        firstName,
        lastName,
        email,
        password: passwordHashed,
        avatar: getAvatar(new Date().getTime().toString()),
        createdAt: now,
        updatedAt: now,
        type: 'USER',
      };
      const params: DocumentClient.TransactWriteItemsInput = {
        TransactItems: [
          {
            Put: {
              TableName: getEnv().MAIN_TABLE,
              ConditionExpression: 'attribute_not_exists(pk)',
              Item: {
                pk: `USER#${user.id}`,
                sk: 'META',
                gsi1pk: 'USERS',
                gsi1sk: `CREATED_AT#${user.createdAt}`,
                ...user,
              },
            },
          },
          {
            Put: {
              TableName: getEnv().MAIN_TABLE,
              ConditionExpression: 'attribute_not_exists(pk)',
              Item: {
                pk: `EMAIL#${email}`,
                sk: 'EMAIL',
                userId: user.id,
              },
            },
          },
        ],
      };
      await DBClient.transactWrite(params).promise();
      return plainToInstance(User, user, { excludeExtraneousValues: true });
    } catch (error) {
      throw new InternalServerException(error);
    }
  }
}
