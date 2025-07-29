import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import * as path from 'path';
import configuration from './common/config/config';
import { allEntities } from './database';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/member/user.module';
import { MovieModule } from './modules/movie/movie.module';
import { OrderModule } from './modules/order/order.module';
import { PromotionModule } from './modules/promotion/promotion.module';
import { ActorModule } from './modules/actor/actor.module';
import { GerneModule } from './modules/gerne/gerne.module';
import { VersionModule } from './modules/version/version.module';
import { CinemaRoomModule } from './modules/cinema-room/cinema-room.module';
import { ScheduleModule as ScheduleByDb } from './modules/schedule/schedule.module';
import { SeatModule } from './modules/seat/seat.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { CronModule } from './common/cron/cron.module';
import { MyGateWayModule } from './common/gateways/seat.gateway.module';
import { S3Module } from './common/s3/s3.module';
import { ScheduleSeatModule } from './modules/scheduleseat/scheduleseat.module';
import { ProductModule } from './modules/product/product.module';
import { HistoryScoreModule } from './modules/historyScore/historyScore.module';
import { PaymentMethodModule } from './modules/payment-method/payment-method.module';
import { OverviewModule } from './modules/overview/overview.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        url: configService.get<string>('database.url'),
        // host: configService.get<string>('database.host'),
        // port: configService.get<number>('database.port'),
        // username: configService.get<string>('database.username'),
        // password: configService.get<string>('database.password'),
        // database: configService.get<string>('database.name'),
        entities: allEntities,
        synchronize: false,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('gmail.host'),
          port: configService.get<number>('gmail.port'),
          secure: false,
          auth: {
            user: configService.get('gmail.user'),
            pass: configService.get('gmail.pass'),
          },
        },
        defaults: {
          from: '"BeMovie Team 1-3" <noreply@bemovie.com>',
        },
        template: {
          dir: path.join(__dirname, '..', 'template'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
      inject: [ConfigService],
    }),

    // Application Modules
    ActorModule,
    AuthModule,
    CinemaRoomModule,
    GerneModule,
    HistoryScoreModule,
    MovieModule,
    OrderModule,
    OverviewModule,
    ProductModule,
    PromotionModule,
    PaymentMethodModule,
    ScheduleByDb,
    ScheduleSeatModule,
    SeatModule,
    // TesterModule,
    TicketModule,
    UserModule,
    VersionModule,

    // Shared Modules
    CronModule,
    MyGateWayModule,
    S3Module,
  ],
})
export class AppModule {}
