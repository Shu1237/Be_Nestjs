import { FilterField } from 'src/common/utils/type';

export const gerneFieldMapping: Record<string, FilterField> = {

  is_deleted: {
    field: 'gerne.is_deleted',
    operator: '=',
  },
  search: {
    customWhere: (qb, value) => {
      qb.andWhere('gerne.genre_name LIKE :search', {
        search: `%${value}%`,
      });
    },
  },
};
