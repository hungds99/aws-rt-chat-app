import { Expose } from 'class-transformer';
import { Model } from './model';

export class User extends Model {
  @Expose()
  id: string;

  @Expose()
  connectionId?: string;

  @Expose()
  email: string;

  @Expose({ groups: ['admin'] })
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

export class AuthUser extends User {
  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;
}

export type CreateUserInput = Pick<User, 'email' | 'password' | 'firstName' | 'lastName'>;
