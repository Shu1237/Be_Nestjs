import { Module } from "@nestjs/common";
import { ZalopayService } from "./zalopay.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Seat } from "src/typeorm/entities/cinema/seat";
import { TicketType } from "src/typeorm/entities/order/ticket-type";
import { MomoModule } from "../momo/momo.module";





@Module({
  imports: [TypeOrmModule.forFeature([TicketType, Seat]), MomoModule,],
  controllers: [],
  providers: [ZalopayService],
  exports: [ZalopayService]
})
export class ZalopayModule { }
