import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { HistoryScoreService } from './historyScore.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import {
  ApiQuery,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { HistoryScorePaginationDto } from 'src/common/pagination/dto/historyScore/historyScorePagination.dto';
import { JWTUserType } from 'src/common/utils/type';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('history-score')
export class HistoryScoreController {
  constructor(private readonly historyScoreService: HistoryScoreService) { }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('admin')
  @ApiOperation({ summary: 'Get all history scores for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    example: '2025-07-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    example: '2025-07-05',
  })
  @ApiQuery({ name: 'search', required: false, type: String, example: '' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'history_score.created_at',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  getHistoryScore(@Query() query: HistoryScorePaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;
    return this.historyScoreService.getAllHistoryScore({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  @Get('user')
  @ApiOperation({ summary: 'Get history scores for user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    example: '2025-07-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    example: '2025-07-05',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'history_score.created_at',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  getHistoryScoreByUserId(
    @Query() query: HistoryScorePaginationDto,
    @Req() req,
  ) {
    const user = req.user as JWTUserType;
    const { page = 1, take = 10, ...restFilters } = query;

    return this.historyScoreService.getHistoryScoreByUserId({
      page,
      take: Math.min(take, 100),
      ...restFilters,
      userId: user.account_id,
    });
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get history score by ID' })
  @ApiParam({ name: 'id', required: true, type: Number, example: 1 })
  getHistoryScoreById(@Param('id', ParseIntPipe) id: number) {
    return this.historyScoreService.getHistoryScoreById(id);
  }
}
