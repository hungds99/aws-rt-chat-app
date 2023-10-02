import { DB_IN_OPERATIONS_LIMIT } from '@common/constants';

export const chunk = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    const chunk: T[] = array.slice(i, i + size);
    result.push(chunk);
  }
  return result;
};

export const chunkDBQueryIDsInOperator = (
  ids: string[],
): {
  chunkedExpressionAttributeValues: { [key: string]: any };
  chunkedFilterExpression: string;
} => {
  const chunkedExpressionAttributeValues: { [key: string]: any } = {};
  const filterExpression: string[] = [];
  const chunkedIds: string[][] = chunk<string>(ids, DB_IN_OPERATIONS_LIMIT);
  chunkedIds.forEach((chunkedIds: string[]) => {
    const filter = [];
    chunkedIds.forEach((id: string, index) => {
      chunkedExpressionAttributeValues[`:id${index}`] = id;
      filter.push(`:id${index}`);
    });
    filterExpression.push(`id IN (${filter.join(',')})`);
  });
  return {
    chunkedExpressionAttributeValues,
    chunkedFilterExpression: filterExpression.join(' OR '),
  };
};
