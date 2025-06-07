import { Module } from "@nestjs/common";
import { ZalopayService } from "./zalopay.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Member } from "src/typeorm/entities/user/member";
import { Seat } from "src/typeorm/entities/cinema/seat";
import { Order } from "src/typeorm/entities/order/order";
import { Ticket } from "src/typeorm/entities/order/ticket";
import { User } from "src/typeorm/entities/user/user";
import { Transaction } from "src/typeorm/entities/order/transaction";
import { TicketType } from "src/typeorm/entities/order/ticket-type";
import { Promotion } from "src/typeorm/entities/promotion/promotion";




@Module({
  imports: [TypeOrmModule.forFeature([Promotion,TicketType,Member, User, Transaction, Order, Ticket, Seat])],
  controllers: [],
  providers: [ZalopayService],
  exports: [ZalopayService]
})
export class ZalopayModule {}
