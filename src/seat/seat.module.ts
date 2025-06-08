import { Module } from "@nestjs/common";
import { SeatController } from "./seat.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SeatService } from "./seat.service";
import { Seat } from "src/typeorm/entities/cinema/seat";



@Module({
    imports: [TypeOrmModule.forFeature([Seat])],
    controllers: [SeatController],
    providers: [SeatService],
})
export class SeatModule {}