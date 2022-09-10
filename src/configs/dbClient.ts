import { DocumentClient } from 'aws-sdk/clients/dynamodb';

const options = !process.env.NODE_ENV
    ? {
          region: 'ap-southeast-1',
          endpoint: 'http://localhost:4566',
      }
    : { region: 'ap-southeast-1' };

export const DBClient: DocumentClient = new DocumentClient({ ...options });
