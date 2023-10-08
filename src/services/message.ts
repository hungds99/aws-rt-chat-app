import { BaseMessageRepository } from '@repositories/message';
import { validateSchema } from '@utils/validation';
import { NewMessageSchema } from '@validations/message';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { Message } from './../models/message';

interface MessageService {
  create(roomId: string, owner: string, content: string): Promise<Message>;
}

export default class BaseMessageService implements MessageService {
  private readonly messageRepository: BaseMessageRepository;

  constructor() {
    this.messageRepository = new BaseMessageRepository();
  }

  async create(roomId: string, owner: string, content: string): Promise<Message> {
    await validateSchema(NewMessageSchema, { roomId, owner, content });

    const now = new Date().getTime();
    const message = plainToInstance(Message, {
      id: uuidv4(),
      roomId,
      owner,
      content,
      createdAt: now,
      updatedAt: now,
      type: 'MESSAGE',
    });

    await this.messageRepository.create(message);
    return message;
  }
}
