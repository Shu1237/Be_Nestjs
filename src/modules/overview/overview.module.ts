import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Movie } from "src/database/entities/cinema/movie";
import { Schedule } from "src/database/entities/cinema/schedule";
import { Order } from "src/database/entities/order/order";
import { Ticket } from "src/database/entities/order/ticket";
import { TicketType } from "src/database/entities/order/ticket-type";
import { OrderDetail } from "src/database/entities/order/order-detail";
import { OrderExtra } from "src/database/entities/order/order-extra";
import { User } from "src/database/entities/user/user";
import { Product } from "src/database/entities/item/product";
import { OverviewController } from "./overview.controller";
import { OverviewService } from "./overview.service";


@Module({
    imports: [TypeOrmModule.forFeature([
        Order,
        User,
        Movie,
        Ticket,
        TicketType,
        Schedule,
        Product,
        OrderDetail,
        OrderExtra
    ])],
    controllers: [OverviewController],
    providers: [OverviewService],
})
export class OverviewModule {}