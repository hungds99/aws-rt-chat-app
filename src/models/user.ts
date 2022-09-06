import { Expose } from 'class-transformer';

export class User {
    @Expose() userId: string;
    @Expose() email: string;
    @Expose() userName: string;
    @Expose() createdAt: string;
}
