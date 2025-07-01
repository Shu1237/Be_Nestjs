import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from 'src/database/entities/cinema/schedule';
import { Repository, LessThan } from 'typeorm';
import { TimeUtil } from 'src/common/utils/time.util';

@Injectable()
export class ScheduleExpireCheckService {
  private readonly logger = new Logger(ScheduleExpireCheckService.name);

  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
  ) {}

  // Chạy 12h tối
  @Cron('0 0 * * *', { name: 'expire-schedules' })
  async handleExpireSchedules() {
    this.logger.log('Starting schedule expiration check');
    
    try {
      const now = new Date();
      const expiredSchedules = await this.scheduleRepository.find({
        where: {
          end_movie_time: LessThan(now),
          is_deleted: false,
        },
      });

      if (expiredSchedules.length > 0) {
        for (const schedule of expiredSchedules) {
          schedule.is_deleted = true;
        }
        await this.scheduleRepository.save(expiredSchedules);
        this.logger.log(`Successfully expired ${expiredSchedules.length} schedules`);
      } else {
        this.logger.log('No schedules expired today');
      }
    } catch (error) {
      this.logger.error('Error during schedule expiration check:', error);
    }
  }
}