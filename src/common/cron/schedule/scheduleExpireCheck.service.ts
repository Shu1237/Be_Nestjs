import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { StatusSeat } from 'src/common/enums/status_seat.enum';
import { Schedule } from 'src/database/entities/cinema/schedule';
import { ScheduleSeat} from 'src/database/entities/cinema/schedule_seat';
import { Repository, LessThan } from 'typeorm';

@Injectable()
export class ScheduleExpireCheckService {
  private readonly logger = new Logger(ScheduleExpireCheckService.name);

  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(ScheduleSeat)
    private readonly scheduleSeatRepository: Repository<ScheduleSeat>,
  ) { }

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
        let seatsToRemove: ScheduleSeat[] = [];
        
        for (const schedule of expiredSchedules) {
          schedule.is_deleted = true;
          // Tìm các ghế chưa được đặt của schedule này
          const availableSeats = await this.scheduleSeatRepository.find({
            where: { schedule: { id: schedule.id }, status: StatusSeat.NOT_YET }
          });

          if (availableSeats.length > 0) {
            // Gom lại các seat để xoá
            seatsToRemove.push(...availableSeats);
          }
        }
        
       
        await this.scheduleRepository.save(expiredSchedules);
        
       
        if (seatsToRemove.length > 0) {
          await this.scheduleSeatRepository.remove(seatsToRemove);
        }
        
        this.logger.log(`Successfully expired ${expiredSchedules.length} schedules and removed ${seatsToRemove.length} available seats`);
      } else {
        this.logger.log('No schedules expired today');
      }
    } catch (error) {
      this.logger.error('Error during schedule expiration check:', error);
    }
  }
}