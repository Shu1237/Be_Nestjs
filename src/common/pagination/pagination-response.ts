import { MetaOptions } from '../utils/type';

export function buildPaginationResponse<T>(data: T[], meta: MetaOptions) {
  const {
    total,
    page,
    take,
    totalSuccess,
    totalFailed,
    totalPending,
    revenue,
    ...rest
  } = meta;

  return {
    data,
    meta: {
      total,
      page,
      pageSize: take,
      totalPages: Math.ceil(total / take),
      ...(totalSuccess !== undefined && { totalSuccess }),
      ...(totalFailed !== undefined && { totalFailed }),
      ...(totalPending !== undefined && { totalPending }),
      ...(revenue !== undefined && { revenue: parseFloat(revenue.toString()) }),
      ...rest,
    },
  };
}
