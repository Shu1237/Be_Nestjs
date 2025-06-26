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
import { Transaction } from 'src/database/entities/order/transaction';
import { Order } from 'src/database/entities/order/order';
import { OrderService } from './order/order.service';

@Module({
  imports: [
    RedisModule,
    MyGateWayModule,
    TypeOrmModule.forFeature([RefreshToken, ScheduleSeat, Schedule, Movie, Order, Transaction]),
  ],
  providers: [
    RefreshTokenService, 
    MovieExpireCheckService, 
    ScheduleExpireCheckService,
    OrderService
  ],
  exports: [RefreshTokenService],
  controllers: [],
})
export class CronModule {}
