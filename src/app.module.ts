import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { AuthModule } from './auth/auth.module';
import { TesterModule } from './tester/tester.module';
import * as path from 'path';
import { allEntities } from './typeorm';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from './member/user.module';
import { MovieModule } from './movie/movie.module';
import { OrderModule } from './order/order.module';
import { PromotionModule } from './promotion/promotion.module';
import { ActorModule } from './actor/actor.module';
import { GerneModule } from './gerne/gerne.module';
import { VersionModule } from './version/version.module';
import { CinemaRoomModule } from './cinema-room/cinema-room.module';
import { ScheduleModule as ScheduleByDb } from './schedule/schedule.module';
import { SeatModule } from './seat/seat.module';
import { TicketModule } from './ticket/ticket.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from './cron/cron.module';
import { MyGateWayModule } from './gateways/seat.gateway.module';
import { S3Module } from './common/s3/s3.module';

@Module({
  imports: [
    PassportModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      // url: process.env.DATABASE_URL,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: allEntities,
      synchronize: false,
      autoLoadEntities: true,
      ssl: {
        rejectUnauthorized: false
      },
    }),
    PassportModule.register({
      defaultStrategy: 'jwt'
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


    AuthModule,
    TesterModule,
    UserModule,
    MovieModule,
    OrderModule,
    PromotionModule,
    ActorModule,
    GerneModule,
    VersionModule,
    CinemaRoomModule,
    ScheduleByDb,
    SeatModule,
    TicketModule,



    CronModule,
    MyGateWayModule,

    S3Module

  ],
})
export class AppModule { }

