import { Module } from "@nestjs/common";

import { MyGateWayModule } from "src/gateways/seat.gateway.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleSeat } from "src/typeorm/entities/cinema/schedule_seat";
import { RedisModule } from "src/redis/redis.module";
import { RefreshToken } from "src/typeorm/entities/user/refresh-token";
import { RefreshTokenService } from "./refresh-token/refresh-token.service";


@Module({
    imports: [ RedisModule,MyGateWayModule,TypeOrmModule.forFeature([RefreshToken,ScheduleSeat])], 
    providers: [RefreshTokenService],
    exports: [  RefreshTokenService],
    controllers: [],
})
export class CronModule { }