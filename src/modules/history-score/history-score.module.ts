import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryScore } from 'src/database/entities/order/history_score';
import { HistoryScoreService } from './history-score.service';
import { HistoryScoreController } from './history-score.controller';


@Module({
  imports: [TypeOrmModule.forFeature([HistoryScore])],
  providers: [HistoryScoreService],
  controllers: [HistoryScoreController],
})
export class HistoryScoreModule {}