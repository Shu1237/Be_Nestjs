import { Module } from "@nestjs/common";
import { ZalopayService } from "./zalopay.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Seat } from "src/typeorm/entities/cinema/seat";
import { Order } from "src/typeorm/entities/order/order";
import { Ticket } from "src/typeorm/entities/order/ticket";
import { User } from "src/typeorm/entities/user/user";
import { Transaction } from "src/typeorm/entities/order/transaction";
import { TicketType } from "src/typeorm/entities/order/ticket-type";
import { Promotion } from "src/typeorm/entities/promotion/promotion";
import { MailerModule } from "@nestjs-modules/mailer";
import { MomoModule } from "../momo/momo.module";
import { ScheduleSeat } from "src/typeorm/entities/cinema/schedule_seat";
import { HistoryScore } from "src/typeorm/entities/order/history_score";
import { MyGateWayModule } from "src/gateways/seat.gateway.module";
import { OrderExtra } from "src/typeorm/entities/order/order-extra";




@Module({
  imports: [TypeOrmModule.forFeature([Promotion, TicketType, User, Transaction, Order, Ticket, Seat, ScheduleSeat, HistoryScore,OrderExtra]),
    MomoModule,
    MyGateWayModule
  ],
  controllers: [],
  providers: [ZalopayService],
  exports: [ZalopayService]
})
export class ZalopayModule { }
