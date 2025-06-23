import { Module } from '@nestjs/common';
import { SeatAutoReleaseService } from './seat/seat-auto-release.service';
import { MyGateWayModule } from 'src/gateways/seat.gateway.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleSeat } from 'src/typeorm/entities/cinema/schedule_seat';
import { RedisModule } from 'src/redis/redis.module';
import { RefreshToken } from 'src/typeorm/entities/user/refresh-token';
import { RefreshTokenService } from './refresh-token/refresh-token.service';
import { MovieExpireCheckService } from './movie/movieExpireCheck.service';
import { Movie } from 'src/typeorm/entities/cinema/movie';
import { Schedule } from 'src/typeorm/entities/cinema/schedule';
import { ScheduleExpireCheckService } from './schedule/scheduleExpireCheck.service';

@Module({
  imports: [
    RedisModule,
    MyGateWayModule,
    TypeOrmModule.forFeature([RefreshToken, ScheduleSeat, Movie, Schedule]),
  ],
  providers: [
    SeatAutoReleaseService,
    RefreshTokenService,
    MovieExpireCheckService,
    ScheduleExpireCheckService,
  ],
  exports: [SeatAutoReleaseService, RefreshTokenService],
  controllers: [],
})
export class CronModule {}
