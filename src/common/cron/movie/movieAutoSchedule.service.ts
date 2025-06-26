import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie } from 'src/database/entities/cinema/movie';
import { Schedule } from 'src/database/entities/cinema/schedule';
import { CinemaRoom } from 'src/database/entities/cinema/cinema-room';
import { Repository, MoreThan, Between } from 'typeorm';
import { Order } from 'src/database/entities/order/order';
import { OrderDetail } from 'src/database/entities/order/order-detail';
// Giả sử bạn có Order, OrderDetail entity

@Injectable()
export class MovieAutoScheduleService {
  private readonly logger = new Logger(MovieAutoScheduleService.name);

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(CinemaRoom)
    private readonly cinemaRoomRepository: Repository<CinemaRoom>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderDetail)
    private readonly orderDetailRepository: Repository<OrderDetail>,
  ) {}
  @Cron('0 2 * * *', { name: 'auto-schedule-movies' })
  async handleAutoScheduleMovies() {
    const now = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(now.getDate() - 3);

    // 1. Lấy doanh thu từng phim trong 3 ngày gần nhất
    const movieRevenue = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.orderDetails', 'orderDetail')
      .leftJoin('orderDetail.ticket', 'ticket')
      .leftJoin('ticket.schedule', 'schedule')
      .leftJoin('schedule.movie', 'movie')
      .select('movie.id', 'movieId')
      .addSelect('movie.name', 'movieName')
      .addSelect('SUM(orderDetail.price)', 'totalRevenue')
      .where('order.createdAt BETWEEN :threeDaysAgo AND :now', {
        threeDaysAgo,
        now,
      })
      .groupBy('movie.id')
      .orderBy('totalRevenue', 'DESC')
      .getRawMany();

    if (movieRevenue.length === 0) {
      this.logger.log('No ticket sales in last 3 days, skip auto-schedule.');
      return;
    }

    const totalRevenue = movieRevenue.reduce(
      (sum, m) => sum + Number(m.totalRevenue),
      0,
    );
    const totalSlots = 20;
    const movieSlotPlan = movieRevenue.map((m) => ({
      movieId: m.movieId,
      movieName: m.movieName,
      slots: Math.max(
        1,
        Math.round((Number(m.totalRevenue) / totalRevenue) * totalSlots),
      ),
    }));

    const topMovieId = movieRevenue[0].movieId;
    const cinemaRooms = await this.cinemaRoomRepository.find();

    const slotDuration = 2 * 60 * 60 * 1000;
    const startHour = 8;
    const endHour = 22;
    const peakHours = [18, 19, 20]; // khung giờ vàng

    for (const plan of movieSlotPlan) {
      let slotsToAssign = plan.slots;

      for (const room of cinemaRooms) {
        let currentTime = new Date(now);
        currentTime.setHours(startHour, 0, 0, 0);

        while (slotsToAssign > 0 && currentTime.getHours() < endHour) {
          const slotStart = new Date(currentTime);
          const slotEnd = new Date(currentTime.getTime() + slotDuration);

          // Ưu tiên phim top vào giờ vàng
          if (
            plan.movieId === topMovieId &&
            !peakHours.includes(currentTime.getHours())
          ) {
            currentTime = new Date(currentTime.getTime() + slotDuration);
            continue; // bỏ qua slot không phải giờ vàng
          }

          // Transaction đảm bảo không trùng slot
          await this.scheduleRepository.manager.transaction(async (manager) => {
            const existing = await manager.findOne(Schedule, {
              where: {
                cinemaRoom: room,
                start_movie_time: Between(slotStart, slotEnd),
                is_deleted: false,
              },
            });

            if (!existing) {
              await manager.save(Schedule, {
                movie: { id: plan.movieId },
                cinemaRoom: room,
                start_movie_time: slotStart,
                end_movie_time: slotEnd,
                // version: ...
              });

              this.logger.verbose(
                ` Scheduled: ${plan.movieName} in room ${room.cinema_room_name} at ${slotStart.toLocaleTimeString()}`,
              );
              slotsToAssign--;
            }
          });

          currentTime = new Date(currentTime.getTime() + slotDuration);
        }
      }
    }

    this.logger.log('🎬 Auto-schedule movies completed.');
  }
}
