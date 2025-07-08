import { FilterField } from 'src/common/utils/type';
import { SelectQueryBuilder } from 'typeorm';

export const scheduleFieldMapping: Record<string, FilterField> = {
  movieName: {
    field: 'movie.name',
    operator: 'LIKE',
  },
  cinemaRoomName: {
    field: 'cinemaRoom.cinema_room_name',
    operator: 'LIKE',
  },
  version_id: {
    field: 'version.id',
    operator: '=',
  },
  scheduleStartTime: {
    field: 'schedule.start_movie_time',
    operator: 'BETWEEN',
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere('schedule.start_movie_time >= :startTime', {
        startTime: `${value} 00:00:00`,
      });
    },
  },
  scheduleEndTime: {
    field: 'schedule.start_movie_time',
    operator: 'BETWEEN',
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere('schedule.start_movie_time <= :endTime', {
        endTime: `${value} 23:59:59`,
      });
    },
  },
  is_deleted: {
    field: 'schedule.is_deleted',
    operator: '=',
  },
};
