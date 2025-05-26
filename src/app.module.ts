// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { EmployeesModule } from './employees/employees.module';
import { AuthModule } from './auth/auth.module';
import { RefreshToken } from './typeorm/entities/RefreshToken';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Giúp sử dụng process.env ở mọi nơi
    }),
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as any, // 'mysql'
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
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
        RefreshToken
        
      ],
      synchronize: false, // hoặc true nếu lần đầu chạy
    }),
    EmployeesModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
