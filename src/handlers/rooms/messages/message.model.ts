import { Expose } from 'class-transformer';
import { Base } from '../../../common/model';

export class Message extends Base {
    @Expose()
    id: string;

    @Expose()
    roomId: string;

    @Expose()
    owner: string;

    @Expose()
    content: string;

    @Expose()
    type: 'MESSAGE';
}
