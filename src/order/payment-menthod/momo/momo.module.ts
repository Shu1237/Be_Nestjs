import { Module } from "@nestjs/common";
import { MomoService } from "./momo.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "src/typeorm/entities/order/transaction";
import { Order } from "src/typeorm/entities/order/order";
import { Ticket } from "src/typeorm/entities/order/ticket";
import { User } from "src/typeorm/entities/user/user";
import { MailerModule } from "@nestjs-modules/mailer";
import { ScheduleSeat } from "src/typeorm/entities/cinema/schedule_seat";
import { HistoryScore } from "src/typeorm/entities/order/history_score";
import { OrderExtra } from "src/typeorm/entities/order/order-extra";
import { MyGateWayModule } from "src/gateways/seat.gateway.module";


@Module({
    imports: [TypeOrmModule.forFeature([OrderExtra, Transaction, Order, Ticket, ScheduleSeat, HistoryScore, User]),
        MomoModule,
        MailerModule,
        MyGateWayModule
    ],
    controllers: [],
    providers: [MomoService],
    exports: [MomoService]


})
export class MomoModule { }
