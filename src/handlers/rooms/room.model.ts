import { Expose, Type } from 'class-transformer';
import { Base } from '../../common/model';
import { Message } from './messages/message.model';

export class Room extends Base {
    @Expose()
    roomId: string;

    @Expose()
    roomName: string;

    @Expose()
    owner: string;

    @Expose()
    members: string[];

    @Type(() => Message)
    lastMessage: Message;

    @Expose()
    type: 'GROUP_ROOM' | 'PRIVATE_ROOM';
}
