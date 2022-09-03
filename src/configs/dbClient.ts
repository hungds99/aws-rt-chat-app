import { DynamoDB } from 'aws-sdk';

export const DBClient = new DynamoDB.DocumentClient({
    region: 'ap-southeast-1',
});
