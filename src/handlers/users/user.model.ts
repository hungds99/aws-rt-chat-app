import { Expose } from 'class-transformer';
import { Base } from '../../common/model';

export class User extends Base {
    @Expose()
    userId: string;

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

export type NewUser = Pick<User, 'email' | 'password' | 'firstName' | 'lastName'>;
