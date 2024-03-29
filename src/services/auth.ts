import { BadRequestException, UnauthorizedException } from '@common/exceptions';
import getAvatar from '@libs/getAvatar';
import getCurrentTime from '@libs/getCurrentTime';
import { CreateUserInput, User } from '@models/user';
import { BaseUserRepository } from '@repositories/user';
import { generateJWT, verifyJWT } from '@utils/auth';
import { validateSchema } from '@utils/validation';
import { LoginUserSchema, RegisterUserSchema } from '@validations/auth';
import * as bcrypt from 'bcryptjs';
import { plainToClass } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import BaseUserService from './user';

interface AuthService {
  authorizer(token: string): Promise<User>;
  login(
    email: string,
    password: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
  register(user: CreateUserInput): Promise<User>;
}

export default class BaseAuthService implements AuthService {
  private readonly userService: BaseUserService;
  private readonly userRepository: BaseUserRepository;

  constructor() {
    this.userService = new BaseUserService();
    this.userRepository = new BaseUserRepository();
  }

  async authorizer(token: string): Promise<User> {
    const tokenDecoded = await verifyJWT(token);
    if (!tokenDecoded) {
      throw new UnauthorizedException('Invalid token');
    }
    const user = await this.userRepository.getById(tokenDecoded?.id);
    return user;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    await validateSchema(LoginUserSchema, { email, password });

    const user = await this.userService.findByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Wrong credentials');
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      type: user.type,
    };
    return {
      accessToken: generateJWT(userPayload, { expiresIn: '1d' }),
      refreshToken: generateJWT(userPayload, { expiresIn: '30d' }),
    };
  }

  async register(newUser: CreateUserInput): Promise<User> {
    const { email, password, firstName, lastName } = newUser;
    await validateSchema(RegisterUserSchema, { ...newUser });

    const existedUser = await this.userService.findByEmail(email);
    if (existedUser) {
      throw new BadRequestException('User already exists');
    }

    const now = getCurrentTime();
    const user = plainToClass(User, {
      id: uuidv4(),
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: bcrypt.hashSync(password, 6),
      avatar: getAvatar(new Date().getTime().toString()),
      createdAt: now,
      updatedAt: now,
      type: 'USER',
    });
    const createdUser = await this.userRepository.create(user);
    return createdUser;
  }
}
