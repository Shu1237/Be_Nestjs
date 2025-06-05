import { Module } from "@nestjs/common";
import { MomoController } from "./momo.controller";
import { MomoService } from "./momo.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "src/typeorm/entities/order/transaction";
import { Order } from "src/typeorm/entities/order/order";
import { Ticket } from "src/typeorm/entities/order/ticket";
import { Seat } from "src/typeorm/entities/cinema/seat";
import { User } from "src/typeorm/entities/user/user";
import { Member } from "src/typeorm/entities/user/member";


@Module({
    imports: [TypeOrmModule.forFeature([Member,User,Transaction,Order,Ticket,Seat])],
    controllers: [MomoController],
    providers: [MomoService],
    exports: [MomoService]


})
export class MomoModule {}
