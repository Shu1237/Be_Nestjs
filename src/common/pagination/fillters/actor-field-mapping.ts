

import { FilterField } from 'src/common/utils/type';
import { SelectQueryBuilder } from 'typeorm';

export const actorFieldMapping: Record<string, FilterField> = {
  search: {
    operator: 'LIKE',
    field: '',
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere(
        `(
          actor.name LIKE :search OR
          actor.stage_name LIKE :search OR
          actor.nationality LIKE :search
        )`,
        { search: `%${value}%` }
      );
    },
  },
  name: {
    operator: 'LIKE',
    field: 'actor.name',
  },
  stage_name: {
    operator: 'LIKE',
    field: 'actor.stage_name',
  },
  nationality: {
    operator: 'LIKE',
    field: 'actor.nationality',
  },
  gender: {
    operator: '=',
    field: 'actor.gender',
  },
  date_of_birth: {
    operator: '=',
    field: 'actor.date_of_birth',
  },
};
