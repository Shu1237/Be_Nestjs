import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthTesterController } from './controllers/auth-tester/auth-tester.controller';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RedisModule } from 'src/common/redis/redis.module';
import { OrderModule } from 'src/modules/order/order.module';
import { QrCodeModule } from 'src/common/qrcode/qr.module';
import { PromotionCronService } from 'src/common/cron/promotion/PromotionCron.Service';
import { Promotion } from 'src/database/entities/promotion/promotion';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '1d',
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Promotion]), // 🟢 thêm để dùng được repository của Promotion
    RedisModule,
    OrderModule,
    QrCodeModule,
  ],
  controllers: [AuthTesterController],
  providers: [
    JwtAuthGuard,
    PromotionCronService, // ✅ đăng service thủ công ở đây
  ],
})
export class TesterModule {}
