import { Expose } from 'class-transformer';
import { Base } from '../../common/model';

export class User extends Base {
    @Expose()
    userId: string;

    @Expose()
    email: string;

    @Expose()
    username: string;

    @Expose()
    avatar: string;

    @Expose()
    type: 'USER';
}
