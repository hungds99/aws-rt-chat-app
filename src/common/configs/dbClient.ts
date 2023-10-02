import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { getDynamoDBConfig } from './environment';

const options = getDynamoDBConfig();

export const DBClient: DocumentClient = new DocumentClient({ ...options });
