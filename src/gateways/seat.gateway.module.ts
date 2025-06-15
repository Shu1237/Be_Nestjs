import { Module } from "@nestjs/common";
import { MyGateWay } from "./seat.gateway";
import { JwtModule } from "@nestjs/jwt";
import { SeatModule } from "src/seat/seat.module";


@Module({
    imports: [SeatModule],
    providers: [MyGateWay],
    exports: [MyGateWay],
})

export class MyGateWayModule { }