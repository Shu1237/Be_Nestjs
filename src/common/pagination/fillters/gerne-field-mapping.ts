import { FilterField } from "src/common/utils/type";


export const gerneFieldMapping: Record<string, FilterField> = {
    search: {
        operator: 'LIKE',
        field: '',
        customWhere: (qb, value) => {
            qb.andWhere('gerne.genre_name LIKE :search', {
                search: `%${value}%`,
            });
        },
    },
}