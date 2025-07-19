export enum StatusOrder {
    SUCCESS = 'success',
    FAILED = 'failed',
    PENDING = 'pending'
}
export const StatusOrderWithAll = ['all', ...Object.values(StatusOrder)] as const;
export type StatusOrderWithAllType = typeof StatusOrderWithAll[number];