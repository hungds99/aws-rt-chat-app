import { BaseHttpResponse } from '@common/http-response';
import 'reflect-metadata';

export const wrapperHandler = (handler: any) => {
  return async (event: any, context: any) => {
    try {
      const response = await handler(event, context);
      return new BaseHttpResponse().toSuccessResponse(response);
    } catch (error) {
      return new BaseHttpResponse().toErrorResponse(error);
    }
  };
};
