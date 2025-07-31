import { FilterField } from 'src/common/utils/type';
import { SelectQueryBuilder } from 'typeorm';

export const dailyReportFieldMapping: Record<string, FilterField> = {
  paymentMethod: {
    field: 'paymentMethod.id',
    operator: '=',
  },
  reportDate: {
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere('DATE(dailyReport.reportDate) = DATE(:reportDate)', {
        reportDate: value,
      });
    },
  },
  fromDate: {
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere('DATE(dailyReport.reportDate) >= DATE(:fromDate)', {
        fromDate: value,
      });
    },
  },
  toDate: {
    customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
      qb.andWhere('DATE(dailyReport.reportDate) <= DATE(:toDate)', {
        toDate: value,
      });
    },
  },
  totalAmount: {
    field: 'dailyReport.totalAmount',
    operator: '>=',
  },
  totalOrders: {
    field: 'dailyReport.totalOrders',
    operator: '>=',
  },
  totalFailed: {
    field: 'dailyReport.totalFailed',
    operator: '>=',
  },
};
