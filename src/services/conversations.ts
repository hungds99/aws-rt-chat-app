import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { DBClient } from '../configs/dbClient';
import { Environments } from '../configs/environments';
import { Conversation } from '../models/conversation';

export interface ConversationServices {
    create(createdBy: string): Promise<Conversation>;
}

export class ConversationServicesImpl implements ConversationServices {
    async create(createdBy: string): Promise<Conversation> {
        const params: DocumentClient.PutItemInput = {
            TableName: Environments.MAIN_TABLE,
            Item: {
                pk: `USER_ID#${createdBy}`,
                sk: `CONVERSATION_ID#${uuidv4()}`,
                createdBy,
                createdAt: new Date().getTime(),
            },
        };

        await DBClient.put(params).promise();

        return;
    }
}
