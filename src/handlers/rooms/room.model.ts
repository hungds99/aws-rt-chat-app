import { Expose } from 'class-transformer';
import { Base } from '../../common/model';

export class Room extends Base {
    @Expose()
    roomId: string;

    @Expose()
    roomName: string;

    @Expose()
    createdBy: string;

    @Expose()
    members: string[];

    @Expose()
    type: 'GROUP_ROOM' | 'PRIVATE_ROOM';
}
