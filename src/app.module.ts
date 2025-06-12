// src/app.module.ts
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
import { ScheduleModule } from './schedule/schedule.module';
import { SeatModule } from './seat/seat.module';
import { TicketModule } from './ticket/ticket.module';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';
@Module({
  imports: [
    PassportModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      url: process.env.DATABASE_URL,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: allEntities,
      synchronize: true,
      autoLoadEntities: true,
      ssl: {
        rejectUnauthorized: false
      },

    }),
    PassportModule.register({
      defaultStrategy: 'jwt',
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
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: redisStore as any,
        url: process.env.REDIS_URL,
        ttl: 600, // cache 10 phút
      }),
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
    ScheduleModule,
    SeatModule,
    TicketModule,
  ],
})
export class AppModule { }
