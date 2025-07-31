import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export function applySorting<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  sortBy: string | undefined,
  sortOrder: 'ASC' | 'DESC' | undefined,
  allowedFields: string[],
  defaultField: string,
) {
  const finalSortBy =
    sortBy && allowedFields.includes(sortBy) ? sortBy : defaultField;

  const finalSortOrder = sortOrder ?? 'DESC';

  return qb.orderBy(finalSortBy, finalSortOrder);
}
