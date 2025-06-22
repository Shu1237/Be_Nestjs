import { Module } from "@nestjs/common";

import { MyGateWayModule } from "src/common/gateways/seat.gateway.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleSeat } from "src/database/entities/cinema/schedule_seat";
import { RedisModule } from "src/common/redis/redis.module";
import { RefreshToken } from "src/database/entities/user/refresh-token";
import { RefreshTokenService } from "./refresh-token/refresh-token.service";


@Module({
    imports: [ RedisModule,MyGateWayModule,TypeOrmModule.forFeature([RefreshToken,ScheduleSeat])], 
    providers: [RefreshTokenService],
    exports: [  RefreshTokenService],
    controllers: [],
})
export class CronModule { }