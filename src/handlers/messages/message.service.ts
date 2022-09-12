import { plainToInstance } from 'class-transformer';
import { Message } from './message.model';
import { v4 as uuidv4 } from 'uuid';

export interface MessageServices {
    create(roomId: string, userId: string, createdBy: string, message: string): Promise<Message>;
}

export class MessageServices implements MessageServices {
    async create(roomId: string, userId: string, createdBy: string, message: string): Promise<Message> {
        const messageId = uuidv4();

        // First message in a room
        // Create a room

        // Send message to room
        // Add message to room

        const messageParams = {
            messageId,
            roomId,
            userId,
            message,
            createdAt: new Date().getTime(),
        };

        return plainToInstance(Message, messageParams);
    }
}
