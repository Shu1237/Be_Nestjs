import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from 'src/typeorm/entities/user/user';
import { Role } from 'src/typeorm/entities/user/roles';
import { Member } from 'src/typeorm/entities/user/member';
import { RefreshToken } from 'src/typeorm/entities/user/refresh-token';
import { MailOTP } from 'src/typeorm/entities/user/mail-otp';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh_token.strategy';
import { GoogleStrategy } from './strategies/google.strategy';





@Module({
  imports: [TypeOrmModule.forFeature([User , Member,Role, RefreshToken,MailOTP]),
  JwtModule.register({
    secret: process.env.JWT_SECRET_KEY || 'defaultSecretKey',
    signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
  })],
  controllers: [AuthController],
  providers: [AuthService,LocalStrategy,JwtStrategy,RefreshTokenStrategy,GoogleStrategy]
})
export class AuthModule { }
