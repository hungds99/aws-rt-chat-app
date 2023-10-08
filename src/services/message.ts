import { BaseMessageRepository } from '@repositories/message';
import { validateSchema } from '@utils/validation';
import { NewMessageSchema } from '@validations/message';

import { v4 as uuidv4 } from 'uuid';
import { Message } from './../models/message';
import { plainToClass } from 'class-transformer';
import BaseRoomRepository from '@repositories/room';

type NewMessage = {
  roomId: string;
  userId: string;
  content: string;
};

interface MessageService {
  create(newMessage: NewMessage): Promise<Message>;
  findAllByRoomId(roomId: string): Promise<Message[] | []>;
}

export default class BaseMessageService implements MessageService {
  private readonly messageRepository: BaseMessageRepository;
  private readonly roomRepository: BaseRoomRepository;

  constructor() {
    this.messageRepository = new BaseMessageRepository();
    this.roomRepository = new BaseRoomRepository();
  }

  async create(newMessage: NewMessage): Promise<Message> {
    await validateSchema(NewMessageSchema, newMessage);

    const { roomId, userId, content } = newMessage;

    const now = new Date().getTime();
    const message = plainToClass(Message, {
      id: uuidv4(),
      roomId: roomId,
      userId: userId,
      content: content,
      createdAt: now,
      updatedAt: now,
      type: 'MESSAGE',
    });

    await this.messageRepository.create(message);
    return message;
  }

  async findAllByRoomId(roomId: string): Promise<Message[] | []> {
    const room = await this.roomRepository.getById(roomId);
    const messages = await this.messageRepository.findAllByRoomId(room.id);
    return messages;
  }
}
