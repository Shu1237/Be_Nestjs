import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { HistoryScoreService } from "./historyScore.service";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";
import { ApiBearerAuth } from "@nestjs/swagger";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('history-score')
export class HistoryScoreController {

  constructor(
    private readonly historyScoreService: HistoryScoreService
  ) {
    
  }

  @Get()
  getHistoryScore(@Req() req) {
   return this.historyScoreService.getHistoryScoreById(req.user);
  }


}