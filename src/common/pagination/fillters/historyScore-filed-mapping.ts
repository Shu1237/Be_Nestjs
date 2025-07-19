import { FilterField } from 'src/common/utils/type';
import { SelectQueryBuilder } from 'typeorm';

export const historyScoreFieldMapping: Record<string, FilterField> = {
  search: {
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere(
        '(user.username LIKE :search OR user.email LIKE :search)',
        { search: `%${value}%` },
      );
    },
  },
  startDate: {
  customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere('history_score.created_at >= :start', {
        start: `${value} 00:00:00`,
      });
    },
  },
  endDate: {
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere('history_score.created_at <= :end', {
        end: `${value} 23:59:59`,
      });
    },
  },

};
