import { Module } from "@nestjs/common";
import { MomoController } from "./momo.controller";
import { MomoService } from "./momo.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "src/typeorm/entities/order/transaction";
import { Order } from "src/typeorm/entities/order/order";
import { Ticket } from "src/typeorm/entities/order/ticket";
import { Seat } from "src/typeorm/entities/cinema/seat";


@Module({
    imports: [TypeOrmModule.forFeature([Transaction,Order,Ticket,Seat])],
    controllers: [MomoController],
    providers: [MomoService],
    exports: [MomoService]


})
export class MomoModule {}
