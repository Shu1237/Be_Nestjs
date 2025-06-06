import { Module } from "@nestjs/common";
import { VisaService } from "./visa.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TicketType } from "src/typeorm/entities/order/ticket-type";
import { Seat } from "src/typeorm/entities/cinema/seat";
import { Promotion } from "src/typeorm/entities/promotion/promotion";


@Module({
    imports: [TypeOrmModule.forFeature([TicketType,Seat,Promotion])],
    controllers: [],
    providers: [VisaService],
    exports: [VisaService],
})
export class VisaModule{}