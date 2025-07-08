import { FilterField } from 'src/common/utils/type';

export const seatFieldMapping: Record<string, FilterField> = {
  cinema_room_id: {
    field: 'seat.cinema_room_id',
    operator: '=',
  },
  seat_type_id: {
    field: 'seat.seat_type_id',
    operator: '=',
  },
  seat_row: {
    field: 'seat.seat_row',
    operator: '=',
  },
  seat_column: {
    field: 'seat.seat_column',
    operator: '=',
  },
  is_deleted: {
    field: 'seat.is_deleted',
    operator: '=',
  },
};
