import { Message } from './message';

export class Conversation {
    conversationId: string;
    conversationName: string;
    createdAt: number;
    createdBy: string;
    users: string[];
    messages: Message[];
}
