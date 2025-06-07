import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from '../typeorm/entities/cinema/schedule';
import { Movie } from 'src/typeorm/entities/cinema/movie';
import { CinemaRoom } from 'src/typeorm/entities/cinema/cinema-room';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, Movie, CinemaRoom])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}