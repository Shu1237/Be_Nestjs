import { Module } from "@nestjs/common";
import { MomoService } from "./momo.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "src/database/entities/order/transaction";
import { Order } from "src/database/entities/order/order";
import { Ticket } from "src/database/entities/order/ticket";
import { User } from "src/database/entities/user/user";
import { MailerModule } from "@nestjs-modules/mailer";
import { ScheduleSeat } from "src/database/entities/cinema/schedule_seat";
import { HistoryScore } from "src/database/entities/order/history_score";
import { OrderExtra } from "src/database/entities/order/order-extra";
import { MyGateWayModule } from "src/common/gateways/seat.gateway.module";
import { QrCodeModule } from "src/common/qrcode/qr.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";


@Module({
    imports: [TypeOrmModule.forFeature([OrderExtra, Transaction, Order, Ticket, ScheduleSeat, HistoryScore, User]),
        MomoModule,
        MailerModule,
        MyGateWayModule,
        QrCodeModule,
        JwtModule.registerAsync({
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('jwt.secret'),
        }),
    }),
    ],

    controllers: [],
    providers: [MomoService],
    exports: [MomoService]


})
export class MomoModule { }
