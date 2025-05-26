import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Type } from 'class-transformer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from 'src/typeorm/entities/Account';
import { Role } from 'src/typeorm/entities/Roles';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';


@Module({
  imports: [TypeOrmModule.forFeature([Account,Role]),
PassportModule,JwtModule.register({
  secret:'be_movie',
  signOptions: { expiresIn: '3h' },
})],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy]
})
export class AuthModule { }
