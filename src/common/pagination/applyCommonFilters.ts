import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { FilterField } from '../utils/type';



export function applyCommonFilters<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  filters: Record<string, any>,
  fieldMapping: Record<string, FilterField>,
) {
  for (const key in filters) {
    const value = filters[key];
    // Skip empty values
    if (value === undefined || value === null || value === '') continue;

    const config = fieldMapping[key];
    if (!config) continue; // Skip if field not found in mapping

    const param = config.paramName || key;

    if (config.customWhere) {
      config.customWhere(qb, value);
    } else {
      switch (config.operator) {
        case '=':
          qb.andWhere(`${config.field} = :${param}`, { [param]: value });
          break;
        case '<>':
        case '!=':
          qb.andWhere(`${config.field} <> :${param}`, { [param]: value });
          break;
        case '>':
          qb.andWhere(`${config.field} > :${param}`, { [param]: value });
          break;
        case '<':
          qb.andWhere(`${config.field} < :${param}`, { [param]: value });
          break;
        case '>=':
          qb.andWhere(`${config.field} >= :${param}`, { [param]: value });
          break;
        case '<=':
          qb.andWhere(`${config.field} <= :${param}`, { [param]: value });
          break;
        case 'LIKE':
          qb.andWhere(`${config.field} LIKE :${param}`, {
            [param]: `%${value}%`,
          });
          break;
        case 'ILIKE':
          qb.andWhere(`LOWER(${config.field}) LIKE LOWER(:${param})`, {
            [param]: `%${value}%`,
          });
          break;
        case 'IN':
          if (Array.isArray(value) && value.length > 0) {
            qb.andWhere(`${config.field} IN (:...${param})`, { [param]: value });
          }
          break;
        case 'NOT IN':
          if (Array.isArray(value) && value.length > 0) {
            qb.andWhere(`${config.field} NOT IN (:...${param})`, { [param]: value });
          }
          break;
        case 'BETWEEN':
          if (Array.isArray(value) && value.length === 2) {
            qb.andWhere(`${config.field} BETWEEN :${param}Start AND :${param}End`, {
              [`${param}Start`]: value[0],
              [`${param}End`]: value[1],
            });
          }
          break;
        case 'IS NULL':
          qb.andWhere(`${config.field} IS NULL`);
          break;
        case 'IS NOT NULL':
          qb.andWhere(`${config.field} IS NOT NULL`);
          break;
        default:
          console.warn(`Unsupported operator: ${config.operator}`);
      }
    }
  }
}
