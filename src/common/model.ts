import { Expose } from 'class-transformer';

export class Base {
    @Expose()
    createdAt: string;

    @Expose()
    updatedAt: string;
}
