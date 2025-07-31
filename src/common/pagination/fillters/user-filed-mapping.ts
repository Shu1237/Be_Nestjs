import { FilterField } from 'src/common/utils/type';
import { SelectQueryBuilder } from 'typeorm';

export const userFieldMapping: Record<string, FilterField> = {
  status: {
    field: 'user.status',
    operator: '=',
  },
  roleId: {
    field: 'user.role_id',
    operator: '=',
  },
  search: {
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere(`(user.username LIKE :search OR user.email LIKE :search)`, {
        search: `%${value}%`,
      });
    },
  },
};
