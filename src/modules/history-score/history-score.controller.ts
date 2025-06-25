import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { HistoryScoreService } from './history-score.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';

@ApiTags('HistoryScore')
@ApiBearerAuth()
@Controller('history-score')
export class HistoryScoreController {
  constructor(private readonly historyScoreService: HistoryScoreService) {}

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get history score by ID' })
  async getHistoryById(@Req() req) {
    return this.historyScoreService.getHistoryById(req.user);
  }
}