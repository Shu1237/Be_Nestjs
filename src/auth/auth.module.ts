import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from 'src/typeorm/entities/Account';
import { Role } from 'src/typeorm/entities/Roles';
import { JwtModule } from '@nestjs/jwt';
import { RefreshToken } from 'src/typeorm/entities/RefreshToken';
import { OtpCode } from 'src/typeorm/entities/OtpCode';
import { Member } from 'src/typeorm/entities/Member';
// import { GoogleStrategy } from './google.strategy';




@Module({
  imports: [TypeOrmModule.forFeature([Account, Role, RefreshToken, OtpCode, Member]),
  JwtModule.register({
    secret: process.env.JWT_SECRET_KEY || 'defaultSecretKey',
    signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
  })],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule { }
