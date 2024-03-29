import { Expose } from 'class-transformer';
import { Model } from './model';

export class User extends Model {
  @Expose()
  id: string;

  @Expose()
  connectionId?: string;

  @Expose()
  email: string;

  @Expose()
  password: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  avatar: string;

  @Expose()
  type: 'USER';
}

export type CreateUserInput = Pick<User, 'email' | 'password' | 'firstName' | 'lastName'>;
