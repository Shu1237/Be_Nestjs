import { Module } from '@nestjs/common';

import { MyGateWayModule } from 'src/common/gateways/seat.gateway.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { RedisModule } from 'src/common/redis/redis.module';
import { RefreshToken } from 'src/database/entities/user/refresh-token';
import { RefreshTokenService } from './refresh-token/refresh-token.service';
import { Movie } from 'src/database/entities/cinema/movie';
import { Schedule } from 'src/database/entities/cinema/schedule';
import { MovieExpireCheckService } from './movie/movieExpireCheck.service';
import { ScheduleExpireCheckService } from './schedule/scheduleExpireCheck.service';
import { Promotion } from 'src/database/entities/promotion/promotion';
import { PromotionCronService } from './promotion/PromotionCron.Service';

@Module({
  imports: [
    RedisModule,
    MyGateWayModule,
    TypeOrmModule.forFeature([
      RefreshToken,
      ScheduleSeat,
      Schedule,
      Movie,
      Promotion,
    ]),
  ],

  providers: [
    RefreshTokenService,
    MovieExpireCheckService,
    ScheduleExpireCheckService,
    PromotionCronService,
  ],
  exports: [RefreshTokenService],
  controllers: [],
})
export class CronModule {}
