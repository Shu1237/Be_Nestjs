
import { FilterField } from 'src/common/utils/type';
import { SelectQueryBuilder } from 'typeorm';

export const orderFieldMapping: Record<string, FilterField> = {
  status: {
    field: 'order.status',
    operator: '=',
  },
  userId: {
    field: 'user.id',
    operator: '=',
  },
  search: {
    operator: 'LIKE',
    field: '',
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere(
        '(user.username LIKE :search OR movie.name LIKE :search)',
        { search: `%${value}%` }
      );
    },
  },
  paymentMethod: {
    field: 'paymentMethod.name',
    operator: 'LIKE',
    paramName: 'method',
  },
  startDate: {
    field: 'order.order_date',
    operator: 'BETWEEN',
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere('order.order_date >= :start', {
        start: `${value} 00:00:00`,
      });
    },
  },
  endDate: {
    field: 'order.order_date',
    operator: 'BETWEEN',
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere('order.order_date <= :end', {
        end: `${value} 23:59:59`,
      });
    },
  },
};
