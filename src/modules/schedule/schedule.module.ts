import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from '../../database/entities/cinema/schedule';
import { Movie } from 'src/database/entities/cinema/movie';
import { CinemaRoom } from 'src/database/entities/cinema/cinema-room';
import { Version } from 'src/database/entities/cinema/version';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, Movie, CinemaRoom, Version])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}