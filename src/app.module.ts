// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { AuthModule } from './auth/auth.module';
import { TesterModule } from './tester/tester.module';
import { EmployeesModule } from './employees/employees.module';
import * as path from 'path';
import { allEntities } from './typeorm';
import { PassportModule } from '@nestjs/passport';
import { MovieModule } from './movie/modules/MovieModule';

@Module({
  imports: [
    PassportModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
   
      type: 'mysql', // 'mysql'
      host: 'localhost', // Hoặc sử dụng process.env.DB_HOST nếu cần
      port: 3306,
      username: 'root',
      password: '12345678',
      database: 'be_movietheater',

      entities: allEntities,
      synchronize: true, // Set to false in production
      autoLoadEntities: true,
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT || '465', 10),
        secure: false, 
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      },
      defaults: {
        from: `BeMovie Team 1-3`,
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
    MovieModule,
   

  ],
})
export class AppModule { }
