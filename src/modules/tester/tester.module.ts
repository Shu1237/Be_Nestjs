import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RedisModule } from 'src/common/redis/redis.module';
import { OrderModule } from 'src/modules/order/order.module';
import { QrCodeModule } from 'src/common/qrcode/qr.module';
import { PromotionCronService } from 'src/common/cron/promotion/PromotionCron.Service';
import { Promotion } from 'src/database/entities/promotion/promotion';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { Schedule } from 'src/database/entities/cinema/schedule';
import { TesterController } from './tester.controller';
import { TesterService } from './tester.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Promotion, Schedule, ScheduleSeat])],
  controllers: [TesterController],
  providers: [TesterService],
})
export class TesterModule { }
