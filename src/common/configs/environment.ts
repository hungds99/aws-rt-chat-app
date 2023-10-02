import * as dotenv from 'dotenv';

dotenv.config();

export const getEnv = () => {
  return {
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
    WS_API_VERSION: process.env.WS_API_VERSION,
    WS_HOST: process.env.WS_HOST,
    AWS_REGION: process.env.AWS_REGION,
    MAIN_TABLE: process.env.AWS_DYNAMODB_TABLE,
    AWS_DYNAMODB_ENDPOINT: process.env.AWS_DYNAMODB_ENDPOINT,
  };
};

export const getDynamoDBConfig = () => {
  const env = getEnv();
  const options = !env.NODE_ENV
    ? {
        region: env.AWS_REGION,
        endpoint: env.AWS_DYNAMODB_ENDPOINT,
      }
    : { region: env.AWS_REGION };

  return options;
};
