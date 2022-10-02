import * as dotenv from 'dotenv';

dotenv.config();

export const ENV = Object.freeze({
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
});
