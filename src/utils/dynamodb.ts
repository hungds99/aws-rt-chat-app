import { DB_IN_OPERATIONS_LIMIT } from '@common/constants';

export const chunk = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    const chunk: T[] = array.slice(i, i + size);
    result.push(chunk);
  }
  return result;
};

export const chunkDBQueryIDsInOperator = (ids: string[]) => {
  const chunkedIdsObj: Record<string, any> = {};
  const chunkedFilterArr: string[] = [];

  const chunkedIds: string[][] = chunk<string>(ids, DB_IN_OPERATIONS_LIMIT);
  chunkedIds.forEach((chunkedIds: string[]) => {
    const filter = [];
    chunkedIds.forEach((id: string, index) => {
      chunkedIdsObj[`:id${index}`] = id;
      filter.push(`:id${index}`);
    });
    chunkedFilterArr.push(`id IN (${filter.join(',')})`);
  });
  return { chunkedIdsObj, chunkedIdsFilterStr: chunkedFilterArr.join(' OR ') };
};
