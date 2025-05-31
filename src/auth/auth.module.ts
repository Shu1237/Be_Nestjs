import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtModule } from '@nestjs/jwt';

// import { GoogleStrategy } from './google.strategy';




@Module({
  imports: [TypeOrmModule.forFeature([]),
  JwtModule.register({
    secret: process.env.JWT_SECRET_KEY || 'defaultSecretKey',
    signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
  })],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule { }
