import { Search } from '@nestjs/common';
import { FilterField } from 'src/common/utils/type';
import { SelectQueryBuilder } from 'typeorm';

export const promotionFieldMapping: Record<string, FilterField> = {
  exchange: {
    field: 'promotion.exchange',
    operator: '=',
  },
  exchangeFrom: {
    customWhere: (qb: SelectQueryBuilder<any>, value: number) => {
      qb.andWhere('promotion.exchange >= :exchangeFrom', {
        exchangeFrom: value,
      });
    },
  },
  exchangeTo: {
    customWhere: (qb: SelectQueryBuilder<any>, value: number) => {
      qb.andWhere('promotion.exchange <= :exchangeTo', { exchangeTo: value });
    },
  },
  promotion_type_id: {
    field: 'promotion.promotion_type_id',
    operator: '=',
  },
  startTime: {
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere('promotion.start_time >= :startTime', {
        startTime: `${value} 00:00:00`,
      });
    },
  },
  endTime: {
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere('promotion.end_time <= :endTime', {
        endTime: `${value} 23:59:59`,
      });
    },
  },
  is_active: {
    field: 'promotion.is_active',
    operator: '=',
  },
  search: {
    customWhere(qb: SelectQueryBuilder<any>, value: string) {
      qb.andWhere(
        `(promotion.title LIKE :search OR promotion.detail LIKE :search)`,
        { search: `%${value}%` },
      );
    },
  },
};
