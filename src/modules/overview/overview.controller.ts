import { Controller, Get, Req, UseGuards, Query } from "@nestjs/common";
import { OverviewService } from "./overview.service";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";
import { checkAdminEmployeeRole } from "src/common/role/admin_employee";
import { JWTUserType } from "src/common/utils/type";
import { ApiBearerAuth } from "@nestjs/swagger/dist/decorators/api-bearer.decorator";


// @UseGuards(JwtAuthGuard)
@Controller("overview")
@ApiBearerAuth()
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get()
  getOverview(@Req() req) {
    const user = req.user as JWTUserType;
    checkAdminEmployeeRole(user, 'Only admin and employee can access overview');
    return this.overviewService.getOverview();
  }

//   @Get('revenue-growth')
//   getRevenueGrowth(@Req() req, @Query('days') days?: string) {
//     const user = req.user as JWTUserType;
//     checkAdminEmployeeRole(user, 'Only admin and employee can access revenue growth data');
//     const periodDays = days ? parseInt(days) : 30;
//     return this.overviewService.getRevenueGrowth(periodDays);
//   }

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