import { Module } from '@nestjs/common';
import { AuthTesterController } from './controllers/auth-tester/auth-tester.controller';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from 'src/redis/redis.module';
import { OrderModule } from 'src/order/order.module';
import { QrCodeModule } from 'src/qrcode/qr.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY, 
      signOptions: { expiresIn: '1d' },    
    }),
    RedisModule,
    OrderModule,
    QrCodeModule
  ],
  controllers: [AuthTesterController],
  providers: [JwtAuthGuard],
})
export class TesterModule {}
