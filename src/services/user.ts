import { User } from '@models/user';
import { BaseUserRepository } from '@repositories/user';
import { plainToInstance } from 'class-transformer';

interface UserService {
  updateConnection(userId: string, connectionId: string): Promise<User>;
  findByEmail(email: string, isAdmin?: boolean): Promise<User>;
  findAll(): Promise<User[] | []>;
  findById(id: string): Promise<User | null>;
}

export default class BaseUserService implements UserService {
  private readonly userRepository: BaseUserRepository;

  constructor() {
    this.userRepository = new BaseUserRepository();
  }

  async updateConnection(userId: string, connectionId?: string): Promise<User> {
    const user = plainToInstance(User, {
      id: userId,
      connectionId: connectionId,
    });
    const updatedUser = await this.userRepository.updateProfile(user);
    return updatedUser;
  }

  async findByEmail(email: string, isAdmin?: boolean): Promise<User> {
    const userId = await this.userRepository.findUserIdByEmail(email);
    const user = await this.userRepository.findById(userId);
    const detailUser = plainToInstance(User, user, {
      groups: isAdmin ? ['admin'] : [],
      excludeExtraneousValues: true,
    });
    return detailUser;
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
