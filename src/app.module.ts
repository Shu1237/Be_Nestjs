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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: allEntities,
      synchronize: true,
      autoLoadEntities: true,
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
    AuthModule,
    TesterModule,
    UserModule,
    MovieModule,
    OrderModule,
    PromotionModule,
  ],
})
export class AppModule {}
