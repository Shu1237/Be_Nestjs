import { Module } from '@nestjs/common';
import { AuthTesterController } from './controllers/auth-tester/auth-tester.controller';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY, // đảm bảo biến này tồn tại trong .env
      signOptions: { expiresIn: '1d' },    // thời hạn token, có thể điều chỉnh
    }),
    RedisModule
  ],
  controllers: [AuthTesterController],
  providers: [JwtAuthGuard],
})
export class TesterModule {}
