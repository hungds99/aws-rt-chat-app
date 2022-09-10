import { Expose } from 'class-transformer';

export class User {
    @Expose()
    userId: string;

    @Expose()
    email: string;

    @Expose()
    username: string;

    @Expose()
    avatar: string;

    @Expose()
    createdAt: string;
}
