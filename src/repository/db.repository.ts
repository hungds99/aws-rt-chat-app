import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ENV } from '@common/environment';

interface BaseDynamoDBRepository<T> {
  putItem(tableName: string, item: T): Promise<T>;
}

export class DynamoDBRepository<T> implements BaseDynamoDBRepository<T> {
  ddbDocClient: DynamoDBDocumentClient;

  constructor() {
    const marshallOptions = {
      // Whether to automatically convert empty strings, blobs, and sets to `null`.
      convertEmptyValues: false, // false, by default.
      // Whether to remove undefined values while marshalling.
      removeUndefinedValues: false, // false, by default.
      // Whether to convert typeof object to map attribute.
      convertClassInstanceToMap: false, // false, by default.
    };

    const unmarshallOptions = {
      // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
      wrapNumbers: false, // false, by default.
    };

    const translateConfig = { marshallOptions, unmarshallOptions };

    const options = !ENV.NODE_ENV
      ? {
          region: ENV.AWS_REGION,
          endpoint: ENV.AWS_DYNAMODB_ENDPOINT,
        }
      : { region: ENV.AWS_REGION };

    // Bare-bones DynamoDB Client
    const client = new DynamoDBClient({
      ...options,
    });

    this.ddbDocClient = DynamoDBDocumentClient.from(client, translateConfig);
  }

  async putItem(tableName: string, item: T): Promise<T> {
    const putCommand = new PutCommand({
      TableName: tableName,
      Item: item,
    });
    const result = await this.ddbDocClient.send(putCommand);
    return result.Attributes as T;
  }
}
