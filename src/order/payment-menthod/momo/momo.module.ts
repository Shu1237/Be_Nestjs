import { Module } from "@nestjs/common";
import { MomoController } from "./momo.controller";
import { MomoService } from "./momo.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "src/typeorm/entities/order/transaction";
import { Order } from "src/typeorm/entities/order/order";


@Module({
    imports: [TypeOrmModule.forFeature([Transaction,Order])],
    controllers: [MomoController],
    providers: [MomoService],
    exports: [MomoService]


})
export class MomoModule {}
