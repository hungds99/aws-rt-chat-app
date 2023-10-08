import { Expose, Type } from 'class-transformer';
import { Message } from './message';
import { Model } from './model';

export class Room extends Model {
  @Expose()
  id: string;

  @Expose()
  roomName: string;

  @Expose()
  ownerId: string;

  @Expose()
  memberIds: string[];

  @Type(() => Message)
  lastMessage: Message;

  @Expose()
  type: 'GROUP_ROOM' | 'PRIVATE_ROOM';
}
