import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from 'src/database/entities/user/user';
import { Role } from 'src/database/entities/user/roles';
import { RefreshToken } from 'src/database/entities/user/refresh-token';
import { ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MailerModule } from '@nestjs-modules/mailer';
import { RedisModule } from 'src/common/redis/redis.module';
import { QrCodeModule } from 'src/common/qrcode/qr.module';





@Module({
  imports: [TypeOrmModule.forFeature([User, Role, RefreshToken]),
  JwtModule.registerAsync({
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      secret: configService.get<string>('jwt.secret'),
      signOptions: {
        expiresIn: configService.get<string>('jwt.expiresIn'),
      },
    }),
  }),
  MailerModule,
  RedisModule,
  QrCodeModule,
],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, GoogleStrategy]
})
export class AuthModule { }
