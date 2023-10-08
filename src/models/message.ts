import { Expose } from 'class-transformer';
import { Model } from './model';

export class Message extends Model {
  @Expose()
  id: string;

  @Expose()
  roomId: string;

  @Expose()
  userId: string;

  @Expose()
  content: string;

  @Expose()
  type: 'MESSAGE';
}
