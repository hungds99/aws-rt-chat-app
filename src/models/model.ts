import { Expose } from 'class-transformer';

export class Model {
  @Expose()
  createdAt: number;

  @Expose()
  updatedAt: number;
}
