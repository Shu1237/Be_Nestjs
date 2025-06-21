import { Module } from "@nestjs/common";
import { ScheduleSeatController } from "./scheduleseat.controller";
import { ScheduleSeatService } from "./scheduleseat.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleSeat } from "src/typeorm/entities/cinema/schedule_seat";


@Module({
    imports: [TypeOrmModule.forFeature([ScheduleSeat])],
    controllers: [ScheduleSeatController],
    providers: [ScheduleSeatService],
})
export class ScheduleSeatModule {}
