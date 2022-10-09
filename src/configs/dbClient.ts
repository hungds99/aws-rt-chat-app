import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { ENV } from '../common/environment';

const options = !ENV.NODE_ENV
    ? {
          region: ENV.AWS_REGION,
          endpoint: ENV.AWS_DYNAMODB_ENDPOINT,
      }
    : { region: ENV.AWS_REGION };

export const DBClient: DocumentClient = new DocumentClient({ ...options });
