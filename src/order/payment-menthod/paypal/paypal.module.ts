import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Seat } from "src/typeorm/entities/cinema/seat";
import { Order } from "src/typeorm/entities/order/order";
import { Ticket } from "src/typeorm/entities/order/ticket";
import { Transaction } from "src/typeorm/entities/order/transaction";
import { PayPalController } from "./paypal.controller";
import { PayPalService } from "./paypal.service";
import { Member } from "src/typeorm/entities/user/member";
import { User } from "src/typeorm/entities/user/user";
import { Promotion } from "src/typeorm/entities/promotion/promotion";
import { TicketType } from "src/typeorm/entities/order/ticket-type";



@Module({
    imports: [TypeOrmModule.forFeature([Transaction,Order,Ticket,Seat,Member,User,Promotion,TicketType])],
    controllers: [PayPalController],
    providers: [PayPalService],
    exports: [PayPalService]


})
export class PayPalModule {}
