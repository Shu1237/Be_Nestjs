import { FilterField } from 'src/common/utils/type';
import { SelectQueryBuilder } from 'typeorm';

export const versionFieldMapping: Record<string, FilterField> = {
  is_deleted: {
    field: 'version.is_deleted',
    operator: '=',
  },
  search: {
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere(`version.name LIKE :search`, { search: `%${value}%` });
    },
  },
};
