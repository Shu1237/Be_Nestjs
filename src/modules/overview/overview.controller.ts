import { Controller, Get, Req, UseGuards, Query } from '@nestjs/common';
import { OverviewService } from './overview.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger/dist/decorators/api-bearer.decorator';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DailyReportDto } from 'src/common/pagination/dto/dailyReport/dailyReport.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';


@Controller('overview')
@ApiBearerAuth()
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) { }


  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('reports/daily-orders')
  @ApiOperation({ summary: 'Get all daily order reports for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example:
      'paymentMethod.id | dailyReport.reportDate | dailyReport.totalAmount | dailyReport.totalOrders| dailyReport.totalFailed ',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @ApiQuery({
    name: 'reportDate',
    required: false,
    type: String,
    example: '2025-07-01',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    example: '2025-07-01',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    type: String,
    example: '2025-07-31',
  })
  @ApiQuery({
    name: 'paymentMethod',
    required: false,
    type: Number,
    example: 1,
  })
  getDailyOrderReports(@Query() query: DailyReportDto) {
    const { page = 1, take = 10, ...restFilters } = query;
    return this.overviewService.getDailyOrderReports({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }
  
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get()
  getOverview() {
    return this.overviewService.getOverview();
  }

  @Get('top-movies')
  getTopMovies() {
    return this.overviewService.getTopMoviesByRevenue();
  }

  @Get('now-showing')
  getNowShowing() {
    return this.overviewService.getNowShowing();
  }
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('average-order-value')
  getAverageOrderValue() {

    return this.overviewService.getAverageOrderValue();
  }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('customer-retention')
  getCustomerRetentionRate() {
    return this.overviewService.getCustomerRetentionRate();
  }
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('peak-hours-analysis')
  getPeakHoursAnalysis() {
    return this.overviewService.getPeakHoursAnalysis();
  }
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('movie-performance')
  getMoviePerformanceAnalysis() {
    return this.overviewService.getMoviePerformanceAnalysis();
  }
}
