import { Module } from "@nestjs/common";
import { HistoryScoreController } from "./historyScore.controller";
import { HistoryScoreService } from "./historyScore.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HistoryScore } from "src/database/entities/order/history_score";


@Module({
    imports: [TypeOrmModule.forFeature([HistoryScore])], 
    controllers: [HistoryScoreController],
    providers: [HistoryScoreService],

})
export class HistoryScoreModule {}