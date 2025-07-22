import { Controller, Get, Req, UseGuards, Query } from "@nestjs/common";
import { OverviewService } from "./overview.service";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";
import { checkAdminEmployeeRole } from "src/common/role/admin_employee";
import { JWTUserType } from "src/common/utils/type";
import { ApiBearerAuth } from "@nestjs/swagger/dist/decorators/api-bearer.decorator";
import { ApiOperation, ApiQuery } from "@nestjs/swagger";
import { DailyReportDto } from "src/common/pagination/dto/dailyReport/dailyReport.dto";


@UseGuards(JwtAuthGuard)
@Controller("overview")
@ApiBearerAuth()
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) { }


  @Get('reports/daily-orders')
  @ApiOperation({ summary: 'Get all daily order reports for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'paymentMethod.id | dailyReport.reportDate | dailyReport.totalAmount | dailyReport.totalOrders| dailyReport.totalFailed ' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], example: 'DESC' })
  @ApiQuery({ name: 'reportDate', required: false, type: String, example: '2025-07-01' })
  @ApiQuery({ name: 'fromDate', required: false, type: String, example: '2025-07-01' })
  @ApiQuery({ name: 'toDate', required: false, type: String, example: '2025-07-31' })
  @ApiQuery({ name: 'paymentMethod', required: false, type: Number, example: 1 })

  getDailyOrderReports(@Query() query: DailyReportDto, @Req() req) {
    const user = req.user as JWTUserType;
    checkAdminEmployeeRole(user, 'Only admin and employee can access daily order reports');
    const {
      page = 1,
      take = 10,
      ...restFilters
    } = query;
    return this.overviewService.getDailyOrderReports({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  @Get()
  getOverview(@Req() req) {
    const user = req.user as JWTUserType;
    checkAdminEmployeeRole(user, 'Only admin and employee can access overview');
    return this.overviewService.getOverview();
  }

  @Get('top-movies')
  getTopMovies(@Req() req) {
    const user = req.user as JWTUserType;
    // checkAdminEmployeeRole(user, 'Only admin and employee can access revenue growth data');
    return this.overviewService.getTopMoviesByRevenue()
  }

  @Get('now-showing')
  getNowShowing(@Req() req) {
    const user = req.user as JWTUserType;
    // checkAdminEmployeeRole(user, 'Only admin and employee can access revenue growth data');
    return this.overviewService.getNowShowing()

  }

  @Get('average-order-value')
  getAverageOrderValue(@Req() req) {
    const user = req.user as JWTUserType;
    checkAdminEmployeeRole(user, 'Only admin and employee can access average order value');
    return this.overviewService.getAverageOrderValue();
  }

  @Get('customer-retention')
  getCustomerRetentionRate(@Req() req) {
    const user = req.user as JWTUserType;
    checkAdminEmployeeRole(user, 'Only admin and employee can access customer retention data');
    return this.overviewService.getCustomerRetentionRate();
  }

  @Get('peak-hours-analysis')
  getPeakHoursAnalysis(@Req() req) {
    const user = req.user as JWTUserType;
    checkAdminEmployeeRole(user, 'Only admin and employee can access peak hours analysis');
    return this.overviewService.getPeakHoursAnalysis();
  }

  @Get('movie-performance')
  getMoviePerformanceAnalysis(@Req() req) {
    const user = req.user as JWTUserType;
    checkAdminEmployeeRole(user, 'Only admin and employee can access movie performance analysis');
    return this.overviewService.getMoviePerformanceAnalysis();
  }
}
