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



@Module({
    imports: [TypeOrmModule.forFeature([Transaction,Order,Ticket,Seat,Member,User])],
    controllers: [PayPalController],
    providers: [PayPalService],
    exports: [PayPalService]


})
export class PayPalModule {}
