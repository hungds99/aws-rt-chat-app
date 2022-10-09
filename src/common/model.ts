import { Expose } from 'class-transformer';

export class Base {
    @Expose()
    createdAt: number;

    @Expose()
    updatedAt: number;
}
