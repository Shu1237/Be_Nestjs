import { FilterField } from 'src/common/utils/type';
import { SelectQueryBuilder } from 'typeorm';

export const productFieldMapping: Record<string, FilterField> = {
  category: {
    field: 'product.category',
    operator: '=',
  },
  type: {
    field: 'product.type',
    operator: '=',
  },
  is_deleted: {
    field: 'product.is_deleted',
    operator: '=',
  },
  search: {
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere(
        `(product.name LIKE :search OR product.description LIKE :search)`,
        { search: `%${value}%` },
      );
    },
  },
};
