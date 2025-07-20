import { FilterField } from 'src/common/utils/type';
import { SelectQueryBuilder } from 'typeorm';

export const dailyReportFieldMapping: Record<string, FilterField> = {
    paymentMethod: {
        field: 'paymentMethod.id',
        operator: '=',
    },
    reportDate: {
        field: 'dailyReport.reportDate',
        operator: '=',
    },
    fromDate: {
        customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
            qb.andWhere('dailyReport.reportDate >= :fromDate', { fromDate: value });
        },
    },
    toDate: {
        customWhere: (qb: SelectQueryBuilder<any>, value: string) => {
            qb.andWhere('dailyReport.reportDate <= :toDate', { toDate: value });
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
