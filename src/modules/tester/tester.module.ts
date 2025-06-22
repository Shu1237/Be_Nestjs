import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthTesterController } from './controllers/auth-tester/auth-tester.controller';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RedisModule } from 'src/common/redis/redis.module';
import { OrderModule } from 'src/modules/order/order.module';
import { QrCodeModule } from 'src/common/qrcode/qr.module';

@Module({
  imports: [
    ConfigModule, // cần import để inject ConfigService
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
    RedisModule,
    OrderModule,
    QrCodeModule,
  ],
  controllers: [AuthTesterController],
  providers: [JwtAuthGuard],
})
export class TesterModule {}
