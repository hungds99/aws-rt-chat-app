import { Expose } from 'class-transformer';
import { Base } from '../../common/model';

export class Message extends Base {
    @Expose()
    messageId: string;

    @Expose()
    roomId: string;

    @Expose()
    createdBy: string;

    @Expose()
    content: string;

    @Expose()
    type: 'MESSAGE';
}