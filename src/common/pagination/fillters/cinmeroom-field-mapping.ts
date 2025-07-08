import { FilterField } from "src/common/utils/type";

export const cinemaRoomFieldMapping: Record<string, FilterField> = {
  search: {
    operator: 'LIKE',
    field: '',
    customWhere: (qb, value) => {
      qb.andWhere('cinemaRoom.cinema_room_name LIKE :search', {
        search: `%${value}%`,
      });
    },
  },
};
