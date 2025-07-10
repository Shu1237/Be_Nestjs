import { FilterField } from "src/common/utils/type";

export const cinemaRoomFieldMapping: Record<string, FilterField> = {
  search: {
    customWhere: (qb, value) => {
      qb.andWhere('cinemaRoom.cinema_room_name LIKE :search', {
        search: `%${value}%`,
      });
    },
  },
};
