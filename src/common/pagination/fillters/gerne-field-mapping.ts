import { FilterField } from 'src/common/utils/type';

export const gerneFieldMapping: Record<string, FilterField> = {
  search: {
    customWhere: (qb, value) => {
      qb.andWhere('gerne.genre_name LIKE :search', {
        search: `%${value}%`,
      });
    },
  },
};
