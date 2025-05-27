// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import { Account } from './typeorm/entities/Account';
import { Role } from './typeorm/entities/Roles';
import { Employee } from './typeorm/entities/Employtee';
import { Member } from './typeorm/entities/Member';
import { MovieDate } from './typeorm/entities/Movie_date';
import { MovieSchedule } from './typeorm/entities/Movie_schedule';
import { MovieType } from './typeorm/entities/Movie_type';
import { Invoice } from './typeorm/entities/Movie_Invoice';
import { Movie } from './typeorm/entities/Movie';
import { Schedule } from './typeorm/entities/Schedule';
import { ShowDate } from './typeorm/entities/Show_date';
import { Type } from './typeorm/entities/Type';
import { RefreshToken } from './typeorm/entities/RefreshToken';

import { EmployeesModule } from './employees/employees.module';
import { AuthModule } from './auth/auth.module';
import { TesterModule } from './tester/tester.module';
import { OtpCode } from './typeorm/entities/OtpCode';
import * as path from 'path';
import { MemberModule } from './member/member.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as any,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [
        Account,
        Employee,
        Member,
        MovieDate,
        MovieSchedule,
        MovieType,
        Invoice,
        Movie,
        Role,
        Schedule,
        ShowDate,
        Type,
        RefreshToken,
        OtpCode,
      ],
      synchronize: false,
      autoLoadEntities: true,
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT || '587', 10),
        secure: false, // true nếu dùng port 465
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      },
      defaults: {
        from: `"BeMovie Team" <${process.env.MAIL_USER}>`,
      },
      template: {
        dir: path.join(__dirname, '..', 'template'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    EmployeesModule,
    AuthModule,
    TesterModule,
    MemberModule,
  ],
})
export class AppModule {}
