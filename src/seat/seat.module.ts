import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seat } from 'src/typeorm/entities/cinema/seat';
import { SeatType } from 'src/typeorm/entities/cinema/seat-type';
import { SeatController } from './seat.controller';
import { SeatTypeController } from './seat-type.controller';
import { SeatService } from './seat.service';
import { SeatTypeService } from './seat-type.service';
import { CacheModule } from '@nestjs/cache-manager';
import { CinemaRoom } from 'src/typeorm/entities/cinema/cinema-room';

@Module({
  imports: [
    TypeOrmModule.forFeature([Seat, SeatType, CinemaRoom]),
    CacheModule.register({
      ttl: 10 * 60,
    }),
  ],
  controllers: [SeatController, SeatTypeController],
  providers: [SeatService, SeatTypeService],
  exports: [SeatService, SeatTypeService],
})
export class SeatModule {}
