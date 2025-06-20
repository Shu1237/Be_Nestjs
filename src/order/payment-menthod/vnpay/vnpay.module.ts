import { Module } from "@nestjs/common";
import { VnpayService } from "./vnpay.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Seat } from "src/typeorm/entities/cinema/seat";
import { Order } from "src/typeorm/entities/order/order";
import { Ticket } from "src/typeorm/entities/order/ticket";
import { Transaction } from "src/typeorm/entities/order/transaction";
import { MailerModule } from "@nestjs-modules/mailer";
import { MomoModule } from "../momo/momo.module";
import { HistoryScore } from "src/typeorm/entities/order/history_score";
import { User } from "src/typeorm/entities/user/user";
import { MyGateWayModule } from "src/gateways/seat.gateway.module";
import { OrderExtra } from "src/typeorm/entities/order/order-extra";
import { QrCodeModule } from "src/qrcode/qr.module";





@Module({
    imports: [TypeOrmModule.forFeature([Seat, Ticket, Order, Transaction, User, HistoryScore,OrderExtra]), 
    MomoModule,
    MyGateWayModule,
    QrCodeModule
    ],
    controllers: [],
    providers: [VnpayService],
    exports: [VnpayService],
})
export class VnpayModule { }