import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = 'Asia/Ho_Chi_Minh';

export const TimeUtil = {
  now: (): Date => dayjs().tz(TIMEZONE).toDate(),

  toVietnamDate: (input: string | Date): Date => {
    return dayjs(input).tz(TIMEZONE).toDate();
  },

  format: (input: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string => {
    return dayjs(input).tz(TIMEZONE).format(format);
  },

  formatDate: (input: string | Date, format: string): string => {
    return dayjs(input).tz(TIMEZONE).format(format);
  },

   toUTCDateFromVietnamTime: (input: string | Date): Date => {
    return dayjs.tz(input, TIMEZONE).utc().toDate();
  },
  addDaysVietnamTime: (days: number): Date => {
  return dayjs().tz(TIMEZONE).add(days, 'day').utc().toDate(); 
},
};
