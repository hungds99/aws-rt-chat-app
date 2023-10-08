import { User } from '@models/user';
import { BaseUserRepository } from '@repositories/user';
import { plainToClass } from 'class-transformer';

interface UserService {
  updateConnection(userId: string, connectionId: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  findAll(): Promise<User[] | []>;
  findById(id: string): Promise<User | null>;
}

export default class BaseUserService implements UserService {
  private readonly userRepository: BaseUserRepository;

  constructor() {
    this.userRepository = new BaseUserRepository();
  }

  async updateConnection(userId: string, connectionId?: string): Promise<User> {
    const user = plainToClass(User, {
      id: userId,
      connectionId: connectionId,
    });
    const updatedUser = await this.userRepository.updateProfile(user);
    return updatedUser;
  }

  async findByEmail(email: string): Promise<User> {
    const userId = await this.userRepository.findUserIdByEmail(email);
    const user = await this.userRepository.findById(userId);
    console.log('findByEmail user', user);
    return user;
  }

  async findAll(): Promise<User[] | []> {
    const users = await this.userRepository.findAll();
    return users;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.userRepository.findById(id);
    return user;
  }
}
