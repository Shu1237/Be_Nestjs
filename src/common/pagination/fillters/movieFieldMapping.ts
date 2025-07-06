import { FilterField } from 'src/common/utils/type';
import { SelectQueryBuilder } from 'typeorm';

export const movieFieldMapping: Record<string, FilterField> = {
    name: {
        field: 'movie.name',
        operator: 'LIKE',
    },
    director: {
        field: 'movie.director',
        operator: 'LIKE',
    },
    nation: {
        field: 'movie.nation',
        operator: 'LIKE',
    },
    fromDate: {
        field: 'movie.from_date',
        operator: 'BETWEEN',
        customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
            qb.andWhere('movie.from_date >= :start', {
                start: `${value} 00:00:00`,
            });
        },
    },
    toDate: {
        field: 'movie.from_date',
        operator: 'BETWEEN',
        customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
            qb.andWhere('movie.from_date <= :end', {
                end: `${value} 23:59:59`,
            });
        },
    },
    is_deleted: {
        field: 'movie.is_deleted',
        operator: '=',
    },
    actor_id: {
        field: 'actors.id',
        operator: '=',
    },
    gerne_id: {
        field: 'gernes.id',
        operator: '=',
    },
    version_id: {
        field: 'versions.id',
        operator: '=',
    },
    search: {
        operator: 'LIKE',
        field: '',
        customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
            qb.andWhere(
                `(movie.name LIKE :search OR movie.director LIKE :search OR movie.nation LIKE :search)`,
                { search: `%${value}%` },
            );
        },
    },
};
