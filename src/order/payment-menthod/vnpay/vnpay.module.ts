import { Module } from "@nestjs/common";
import { VnpayService } from "./vnpay.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Seat } from "src/typeorm/entities/cinema/seat";
import { Order } from "src/typeorm/entities/order/order";
import { Ticket } from "src/typeorm/entities/order/ticket";
import { Member } from "src/typeorm/entities/user/member";
import { Transaction } from "src/typeorm/entities/order/transaction";

import { MailerModule, MailerService } from "@nestjs-modules/mailer";
import { MomoModule } from "../momo/momo.module";



@Module({
    imports: [TypeOrmModule.forFeature([Seat, Ticket, Order, Transaction, Member]), MomoModule, MailerModule],
    controllers: [],
    providers: [VnpayService],
    exports: [VnpayService],
})
export class VnpayModule { }