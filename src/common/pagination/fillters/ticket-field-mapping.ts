import { FilterField } from 'src/common/utils/type';
import { SelectQueryBuilder } from 'typeorm';

export const ticketFieldMapping: Record<string, FilterField> = {
  search: {
    operator: 'LIKE',
    field: '',
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere(
        `(
         movie.name LIKE :search OR
        seatType.seat_type_name LIKE :search OR
        cinemaRoom.cinema_room_name LIKE :search OR
        ticketType.ticket_name LIKE :search OR
        version.name LIKE :search
        )`,
        { search: `%${value}%` },
      );
    },
  },
  active: {
    field: 'ticket.status',
    operator: '=',
  },
  is_used: {
    field: 'ticket.is_used',
    operator: '=',
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
