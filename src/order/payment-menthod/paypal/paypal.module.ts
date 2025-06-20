import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Seat } from "src/typeorm/entities/cinema/seat";
import { Order } from "src/typeorm/entities/order/order";
import { Ticket } from "src/typeorm/entities/order/ticket";
import { Transaction } from "src/typeorm/entities/order/transaction";
import { PayPalService } from "./paypal.service";
import { User } from "src/typeorm/entities/user/user";
import { Promotion } from "src/typeorm/entities/promotion/promotion";
import { TicketType } from "src/typeorm/entities/order/ticket-type";
import { MomoModule } from "../momo/momo.module";
import { ScheduleSeat } from "src/typeorm/entities/cinema/schedule_seat";
import { HistoryScore } from "src/typeorm/entities/order/history_score";
import { MyGateWayModule } from "src/gateways/seat.gateway.module";
import { OrderExtra } from "src/typeorm/entities/order/order-extra";
import { QrCodeModule } from "src/qrcode/qr.module";



@Module({
    imports: [
        TypeOrmModule.forFeature([
            Transaction,
            Order,
            Ticket,
            Seat,
            User,
            Promotion,
            TicketType,
            ScheduleSeat,
            HistoryScore,
            OrderExtra

        ]),
        MomoModule,
        MyGateWayModule,
        QrCodeModule

    ],
    controllers: [],
    providers: [PayPalService],
    exports: [PayPalService]


})
export class PayPalModule { }
