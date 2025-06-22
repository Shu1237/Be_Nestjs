import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seat } from 'src/database/entities/cinema/seat';
import { SeatType } from 'src/database/entities/cinema/seat-type';
import { SeatController } from './seat.controller';
import { SeatTypeController } from './seat-type.controller';
import { SeatService } from './seat.service';
import { SeatTypeService } from './seat-type.service';
import { CinemaRoom } from 'src/database/entities/cinema/cinema-room';
import { Schedule } from 'src/database/entities/cinema/schedule';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { RedisModule } from 'src/common/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Seat,
      SeatType,
      CinemaRoom,
      Schedule,
      ScheduleSeat,
    ]),
    RedisModule,
  ],
  controllers: [SeatController, SeatTypeController],
  providers: [SeatService, SeatTypeService],
  exports: [SeatService, SeatTypeService],
})
export class SeatModule {}
