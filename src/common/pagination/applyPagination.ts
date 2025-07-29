import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationParams } from '../utils/type';

export function applyPagination<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  { page, take }: PaginationParams,
): SelectQueryBuilder<T> {
  const skip = (page - 1) * take;
  return qb.skip(skip).take(take);
}
