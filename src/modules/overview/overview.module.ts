import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Movie } from "src/database/entities/cinema/movie";
import { Schedule } from "src/database/entities/cinema/schedule";
import { Order } from "src/database/entities/order/order";
import { Ticket } from "src/database/entities/order/ticket";
import { TicketType } from "src/database/entities/order/ticket-type";
import { OrderExtra } from "src/database/entities/order/order-extra";
import { User } from "src/database/entities/user/user";
import { OverviewController } from "./overview.controller";
import { OverviewService } from "./overview.service";
import { DailyTransactionSummary } from "src/database/entities/order/daily_transaction_summary";


@Module({
    imports: [TypeOrmModule.forFeature([
        Order,
        User,
        Movie,
        Ticket,
        TicketType,
        Schedule,
        OrderExtra,
        DailyTransactionSummary
    ])],
    controllers: [OverviewController],
    providers: [OverviewService],
})
export class OverviewModule {}