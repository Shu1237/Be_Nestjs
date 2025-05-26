import { Module } from '@nestjs/common';
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

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '123456',
    database: 'be_movietheater',
    entities: [Account,Employee,Member,MovieDate,MovieSchedule,MovieType,Invoice,Movie,Role,Schedule,ShowDate,Type],
  synchronize: false,  //true first time to create tables
}), EmployeesModule, AuthModule],
controllers: [],
  providers: [],
})
export class AppModule {}
