import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from 'src/database/entities/cinema/schedule';
import { Repository, LessThan } from 'typeorm';
import { ScheduleSeatService } from 'src/modules/scheduleseat/scheduleseat.service';

@Injectable()
export class SeatCleanupService {
  private readonly logger = new Logger(SeatCleanupService.name);

  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    private readonly scheduleSeatService: ScheduleSeatService,
  ) {}

  @Cron('0 3 * * *', { name: 'cleanup-unbooked-seats' })
  async handleCleanupUnbookedSeats() {
    const now = new Date();
    const schedules = await this.scheduleRepository.find({
      where: { end_movie_time: LessThan(now) },
      select: ['id'],
    });

    for (const schedule of schedules) {
      const deleted =
        await this.scheduleSeatService.deleteUnbookedSeatsBySchedule(
          schedule.id,
        );
      if (deleted > 0) {
        this.logger.log(
          `Deleted ${deleted} unbooked seats for schedule ${schedule.id}`,
        );
      }
    }
  }
}
