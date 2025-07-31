import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie } from 'src/database/entities/cinema/movie';
import { Order } from 'src/database/entities/order/order';
import { Ticket } from 'src/database/entities/order/ticket';
import { User } from 'src/database/entities/user/user';
import { TicketType } from 'src/database/entities/order/ticket-type';
import { OrderExtra } from 'src/database/entities/order/order-extra';
import { Schedule } from 'src/database/entities/cinema/schedule';
import { Repository } from 'typeorm';
import {
  OverviewResponseDto,
  TicketTypeSaleDto,
  BestSellingComboDto,
  TimeSlotReportDto,
  PeakHoursRevenueDto,
  TopMovieDto,
  TopCustomerDto,
} from './dtos/overview-response.dto';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { DailyTransactionSummary } from 'src/database/entities/order/daily_transaction_summary';
import { applyCommonFilters } from 'src/common/pagination/applyCommonFilters';
import { DailyReportDto } from 'src/common/pagination/dto/dailyReport/dailyReport.dto';
import { dailyReportFieldMapping } from 'src/common/pagination/fillters/daily-report-mapping';
import { applyPagination } from 'src/common/pagination/applyPagination';
import { applySorting } from 'src/common/pagination/apply_sort';
import { buildPaginationResponse } from 'src/common/pagination/pagination-response';

@Injectable()
export class OverviewService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TicketType)
    private readonly ticketTypeRepository: Repository<TicketType>,
    @InjectRepository(OrderExtra)
    private readonly orderExtraRepository: Repository<OrderExtra>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(DailyTransactionSummary)
    private readonly dailyTransactionSummaryRepository: Repository<DailyTransactionSummary>,
  ) {}
  private mapReportData(data: DailyTransactionSummary) {
    return {
      paymentMethod: data.paymentMethod.name,
      totalOrders: data.totalOrders,
      totalRevenue: data.totalAmount,
      totalFail: data.totalFailed,
      totalSuccess: data.totalSuccess,
      reportDate: data.reportDate,
    };
  }
  async getDailyOrderReports(filters: DailyReportDto) {
    const qb = this.dailyTransactionSummaryRepository
      .createQueryBuilder('dailyReport')
      .leftJoinAndSelect('dailyReport.paymentMethod', 'paymentMethod');
    applyCommonFilters(qb, filters, dailyReportFieldMapping);
    const allowedFileds = [
      'paymentMethod.id',
      'dailyReport.reportDate',
      'dailyReport.totalAmount',
      'dailyReport.totalOrders',
      'dailyReport.totalFailed',
      'dailyReport.totalSuccess',
    ];
    applySorting(
      qb,
      filters.sortBy,
      filters.sortOrder,
      allowedFileds,
      'dailyReport.reportDate',
    );
    applyPagination(qb, {
      take: filters.take,
      page: filters.page,
    });
    const [data, total] = await qb.getManyAndCount();
    const summary = data.map((item) => this.mapReportData(item));

    return buildPaginationResponse(summary, {
      total,
      page: filters.page,
      take: filters.take,
    });
  }
  async getOverview(): Promise<OverviewResponseDto> {
    const [
      totalRevenue,
      ticketsSold,
      totalCustomers,
      activeMovies,
      ticketTypeSales,
      bestSellingCombo,
      timeSlotReport,
      revenueByPeakHours,
      topMoviesByRevenue,
      topCustomersByBookings,
    ] = await Promise.all([
      this.getTotalRevenue(),
      this.getTicketsSold(),
      this.getTotalCustomers(),
      this.getActiveMovies(),
      this.getTicketTypeSalesReport(),
      this.getBestSellingCombo(),
      this.getTimeSlotReport(),
      this.getRevenueByPeakHours(),
      this.getTopMoviesByRevenue(),
      this.getTopCustomersByBookings(),
    ]);

    return {
      summary: {
        totalRevenue,
        ticketsSold,
        totalCustomers,
        activeMovies,
      },
      reports: {
        ticketTypeSales,
        bestSellingCombo,
        timeSlotReport,
        revenueByPeakHours,
        topMoviesByRevenue,
        topCustomersByBookings,
      },
    };
  }

  //  Total Revenue
  private async getTotalRevenue(): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(CAST(order.total_prices AS DECIMAL(10,2)))', 'totalRevenue')
      .where('order.status = :status', { status: StatusOrder.SUCCESS })
      .getRawOne();

    return parseFloat(result?.totalRevenue || '0');
  }

  //  Tickets Sold
  private async getTicketsSold(): Promise<number> {
    const result = await this.ticketRepository
      .createQueryBuilder('ticket')
      .innerJoin('ticket.orderDetail', 'orderDetail')
      .innerJoin('orderDetail.order', 'order')
      .where('order.status = :status', { status: StatusOrder.SUCCESS })
      .getCount();

    return result;
  }

  //  Total Customers
  private async getTotalCustomers(): Promise<number> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .getCount();

    return result;
  }

  //  Active Movies
  private async getActiveMovies(): Promise<number> {
    const currentDate = new Date();
    const result = await this.movieRepository
      .createQueryBuilder('movie')
      .where('movie.from_date <= :currentDate', { currentDate })
      .andWhere('movie.to_date >= :currentDate', { currentDate })
      .getCount();

    return result;
  }

  //  Ticket Type Sales Report
  private async getTicketTypeSalesReport(): Promise<TicketTypeSaleDto[]> {
    const result = await this.ticketTypeRepository
      .createQueryBuilder('ticketType')
      .leftJoin('ticketType.tickets', 'ticket')
      .leftJoin('ticket.orderDetail', 'orderDetail')
      .leftJoin('orderDetail.order', 'order')
      .select([
        'ticketType.ticket_name as ticketName',
        'ticketType.audience_type as audienceType',
        'COUNT(ticket.id) as totalSold',
        'SUM(CAST(orderDetail.total_each_ticket AS DECIMAL(10,2))) as totalRevenue',
      ])
      .where('order.status = :status', { status: StatusOrder.SUCCESS })
      .groupBy('ticketType.id')
      .orderBy('totalSold', 'DESC')
      .getRawMany();

    return result.map((item) => ({
      ticketName: item.ticketName,
      audienceType: item.audienceType,
      totalSold: parseInt(item.totalSold || '0'),
      totalRevenue: parseFloat(item.totalRevenue || '0'),
    }));
  }

  //  Best Selling Combo
  private async getBestSellingCombo(): Promise<BestSellingComboDto[]> {
    const result = await this.orderExtraRepository
      .createQueryBuilder('orderExtra')
      .innerJoin('orderExtra.product', 'product')
      .innerJoin('orderExtra.order', 'order')
      .select([
        'product.name as productName',
        'SUM(orderExtra.quantity) as totalQuantity',
        'SUM(CAST(orderExtra.unit_price AS DECIMAL(10,2)) * orderExtra.quantity) as totalRevenue',
      ])
      .where('order.status = :status', { status: StatusOrder.SUCCESS })
      .groupBy('product.id')
      .orderBy('totalQuantity', 'DESC')
      .limit(10)
      .getRawMany();

    return result.map((item) => ({
      productName: item.productName,
      totalQuantity: parseInt(item.totalQuantity || '0'),
      totalRevenue: parseFloat(item.totalRevenue || '0'),
    }));
  }

  //  Time Slot Report (Bar Chart with Timeline)
  private async getTimeSlotReport(): Promise<TimeSlotReportDto[]> {
    const result = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .innerJoin('schedule.orderDetails', 'orderDetail')
      .innerJoin('orderDetail.order', 'order')
      .select([
        'HOUR(schedule.start_movie_time) as hour',
        'COUNT(orderDetail.id) as ticketsSold',
        'SUM(CAST(orderDetail.total_each_ticket AS DECIMAL(10,2))) as revenue',
      ])
      .where('order.status = :status', { status: StatusOrder.SUCCESS })
      .groupBy('HOUR(schedule.start_movie_time)')
      .orderBy('hour', 'ASC')
      .getRawMany();

    // Fill in missing hours with 0 values
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const found = result.find((item) => parseInt(item.hour) === hour);
      return {
        hour,
        timeSlot: `${hour.toString().padStart(2, '0')}:00`,
        ticketsSold: found ? parseInt(found.ticketsSold) : 0,
        revenue: found ? parseFloat(found.revenue || '0') : 0,
      };
    });

    return hourlyData;
  }

  //  Revenue by Peak Hours
  private async getRevenueByPeakHours(): Promise<PeakHoursRevenueDto[]> {
    const timeSlots = await this.getTimeSlotReport();

    // Define peak hours categories
    const peakCategories = [
      { name: 'Morning (6-12)', hours: [6, 7, 8, 9, 10, 11] },
      { name: 'Afternoon (12-18)', hours: [12, 13, 14, 15, 16, 17] },
      { name: 'Evening (18-24)', hours: [18, 19, 20, 21, 22, 23] },
      { name: 'Late Night (0-6)', hours: [0, 1, 2, 3, 4, 5] },
    ];

    return peakCategories.map((category) => {
      const categoryData = timeSlots.filter((slot) =>
        category.hours.includes(slot.hour),
      );

      return {
        category: category.name,
        totalRevenue: categoryData.reduce((sum, slot) => sum + slot.revenue, 0),
        totalTickets: categoryData.reduce(
          (sum, slot) => sum + slot.ticketsSold,
          0,
        ),
        averageRevenuePerHour:
          categoryData.length > 0
            ? categoryData.reduce((sum, slot) => sum + slot.revenue, 0) /
              categoryData.length
            : 0,
      };
    });
  }

  async getNowShowing() {
    const currentDate = new Date();
    const result = await this.movieRepository
      .createQueryBuilder('movie')
      .where('movie.from_date <= :currentDate', { currentDate })
      .andWhere('movie.to_date >= :currentDate', { currentDate })
      .getMany();

    const nowShowing = result.map((movie) => ({
      id: movie.id,
      name: movie.name,
      director: movie.director,
      duration: movie.duration,
      thumbnail: movie.thumbnail,
      trailer: movie.trailer || '',
      description: movie.content || '',
    }));

    return nowShowing;
  }

  //  Top Movies by Revenue
  async getTopMoviesByRevenue(): Promise<TopMovieDto[]> {
    const result = await this.movieRepository
      .createQueryBuilder('movie')
      .innerJoin('movie.schedules', 'schedule')
      .innerJoin('schedule.orderDetails', 'orderDetail')
      .innerJoin('orderDetail.order', 'order')
      .select([
        'movie.name as movieName',
        'movie.director as director',
        'movie.duration as duration',
        'movie.thumbnail as thumbnail',
        'movie.trailer as trailer',
        'movie.content as description',
        'COUNT(DISTINCT orderDetail.id) as ticketsSold',
        'SUM(CAST(orderDetail.total_each_ticket AS DECIMAL(10,2))) as totalRevenue',
      ])
      .where('order.status = :status', { status: StatusOrder.SUCCESS })
      .groupBy('movie.id')
      .orderBy('totalRevenue', 'DESC')
      .limit(5)
      .getRawMany();

    return result.map((item) => ({
      movieName: item.movieName,
      director: item.director,
      duration: parseInt(item.duration),
      thumbnail: item.thumbnail,
      trailer: item.trailer || '',
      description: item.description || '',
      ticketsSold: parseInt(item.ticketsSold || '0'),
      totalRevenue: parseFloat(item.totalRevenue || '0'),
    }));
  }

  //  Top Customers with Most Bookings
  private async getTopCustomersByBookings(): Promise<TopCustomerDto[]> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.orders', 'order')
      .innerJoin('order.orderDetails', 'orderDetail')
      .select([
        'user.username as username',
        'user.email as email',
        'user.avatar as avatar',
        'COUNT(DISTINCT order.id) as totalOrders',
        'COUNT(orderDetail.id) as totalTickets',
        'SUM(CAST(order.total_prices AS DECIMAL(10,2))) as totalSpent',
      ])
      .where('order.status = :status', { status: StatusOrder.SUCCESS })
      .groupBy('user.id')
      .orderBy('totalOrders', 'DESC')
      .limit(10)
      .getRawMany();

    return result.map((item) => ({
      username: item.username,
      email: item.email,
      avatar: item.avatar,
      totalOrders: parseInt(item.totalOrders || '0'),
      totalTickets: parseInt(item.totalTickets || '0'),
      totalSpent: parseFloat(item.totalSpent || '0'),
    }));
  }

  // Additional Analytics Methods

  // 📈 Revenue Growth (compared to previous period)
  async getRevenueGrowth(
    days: number = 30,
  ): Promise<{
    currentPeriod: number;
    previousPeriod: number;
    growthPercentage: number;
  }> {
    const currentDate = new Date();
    const currentPeriodStart = new Date(
      currentDate.getTime() - days * 24 * 60 * 60 * 1000,
    );
    const previousPeriodStart = new Date(
      currentPeriodStart.getTime() - days * 24 * 60 * 60 * 1000,
    );

    const [currentRevenue, previousRevenue] = await Promise.all([
      this.getRevenueForPeriod(currentPeriodStart, currentDate),
      this.getRevenueForPeriod(previousPeriodStart, currentPeriodStart),
    ]);

    const growthPercentage =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    return {
      currentPeriod: currentRevenue,
      previousPeriod: previousRevenue,
      growthPercentage: Math.round(growthPercentage * 100) / 100,
    };
  }

  // 📊 Average Order Value
  async getAverageOrderValue(): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('AVG(CAST(order.total_prices AS DECIMAL(10,2)))', 'avgOrderValue')
      .where('order.status = :status', { status: StatusOrder.SUCCESS })
      .getRawOne();

    return parseFloat(result?.avgOrderValue || '0');
  }

  // 🎯 Customer Retention Rate (customers who made more than one order)
  async getCustomerRetentionRate(): Promise<{
    retentionRate: number;
    returningCustomers: number;
    totalCustomers: number;
  }> {
    const totalCustomersResult = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.orders', 'order')
      .where('order.status = :status', { status: StatusOrder.SUCCESS })
      .getCount();

    const returningCustomersResult = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.orders', 'order')
      .where('order.status = :status', { status: StatusOrder.SUCCESS })
      .groupBy('user.id')
      .having('COUNT(order.id) > 1')
      .getCount();

    const retentionRate =
      totalCustomersResult > 0
        ? (returningCustomersResult / totalCustomersResult) * 100
        : 0;

    return {
      retentionRate: Math.round(retentionRate * 100) / 100,
      returningCustomers: returningCustomersResult,
      totalCustomers: totalCustomersResult,
    };
  }

  // 🕐 Peak Hours Analysis
  async getPeakHoursAnalysis(): Promise<{
    peakHour: number;
    peakRevenue: number;
    averageHourlyRevenue: number;
  }> {
    const hourlyData = await this.getTimeSlotReport();

    if (hourlyData.length === 0) {
      return { peakHour: 0, peakRevenue: 0, averageHourlyRevenue: 0 };
    }

    const peakHourData = hourlyData.reduce((max, current) =>
      current.revenue > max.revenue ? current : max,
    );

    const totalRevenue = hourlyData.reduce(
      (sum, hour) => sum + hour.revenue,
      0,
    );
    const averageHourlyRevenue = totalRevenue / hourlyData.length;

    return {
      peakHour: peakHourData.hour,
      peakRevenue: peakHourData.revenue,
      averageHourlyRevenue: Math.round(averageHourlyRevenue * 100) / 100,
    };
  }

  // Helper method for revenue calculation by period
  private async getRevenueForPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(CAST(order.total_prices AS DECIMAL(10,2)))', 'totalRevenue')
      .where('order.status = :status', { status: StatusOrder.SUCCESS })
      .andWhere('order.order_date >= :startDate', { startDate })
      .andWhere('order.order_date <= :endDate', { endDate })
      .getRawOne();

    return parseFloat(result?.totalRevenue || '0');
  }

  // 🎬 Movie Performance Analysis
  async getMoviePerformanceAnalysis(): Promise<{
    totalMovies: number;
    activeMovies: number;
    averageRevenue: number;
  }> {
    const [totalMovies, activeMovies, averageRevenue] = await Promise.all([
      this.movieRepository.count(),
      this.getActiveMovies(),
      this.getAverageMovieRevenue(),
    ]);

    return {
      totalMovies,
      activeMovies,
      averageRevenue,
    };
  }

  private async getAverageMovieRevenue(): Promise<number> {
    // First get the total revenue per movie
    const movieRevenues = await this.movieRepository
      .createQueryBuilder('movie')
      .innerJoin('movie.schedules', 'schedule')
      .innerJoin('schedule.orderDetails', 'orderDetail')
      .innerJoin('orderDetail.order', 'order')
      .select([
        'movie.id as movieId',
        'SUM(CAST(orderDetail.total_each_ticket AS DECIMAL(10,2))) as totalRevenue',
      ])
      .where('order.status = :status', { status: StatusOrder.SUCCESS })
      .groupBy('movie.id')
      .getRawMany();

    if (movieRevenues.length === 0) {
      return 0;
    }

    // Calculate average from the results
    const totalRevenue = movieRevenues.reduce(
      (sum, movie) => sum + parseFloat(movie.totalRevenue || '0'),
      0,
    );
    const averageRevenue = totalRevenue / movieRevenues.length;

    return Math.round(averageRevenue * 100) / 100;
  }
}
