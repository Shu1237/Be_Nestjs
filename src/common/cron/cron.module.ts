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
import { Order } from 'src/database/entities/order/order';
import { OrderCronService } from './order/orderCron.service';
import { Promotion } from 'src/database/entities/promotion/promotion';
import { PromotionCronService } from './promotion/PromotionCron.Service';
import { OrderExtra } from 'src/database/entities/order/order-extra';
import { Transaction } from 'src/database/entities/order/transaction';
import { SeatModule } from 'src/modules/seat/seat.module';
import { OrderModule } from 'src/modules/order/order.module';
import { ReportService } from './daily-transaction/daily-transaction.service';


@Module({
  imports: [
    RedisModule,
    MyGateWayModule,
    SeatModule,
    TypeOrmModule.forFeature([RefreshToken, ScheduleSeat, Schedule, Movie, Order, Promotion, OrderExtra, Transaction]),
    OrderModule
  ],
  providers: [
    RefreshTokenService,
    MovieExpireCheckService,
    ScheduleExpireCheckService,
    OrderCronService,
    PromotionCronService,
    ReportService,
  ],

})
export class CronModule { }