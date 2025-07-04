import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { StatusSeat } from 'src/common/enums/status_seat.enum';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { Order } from 'src/database/entities/order/order';
import { Repository, LessThan } from 'typeorm';

@Injectable()
export class OrderCronService {
  private readonly logger = new Logger(OrderCronService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(ScheduleSeat)
    private readonly scheduleSeatRepository: Repository<ScheduleSeat>,
  ) {}

  // Cron chạy mỗi 15 phút
  @Cron('*/20 * * * *', {
    name: 'check-pending-orders-to-fail',
  })
  async handleExpiredPendingOrders() {
    this.logger.log('Checking for expired PENDING orders every 20 minutes');

    try {
      const now = new Date();
      const holdMinutes = 20; // thời gian giữ chỗ tối đa
      const holdThreshold = new Date(now.getTime() - holdMinutes * 60 * 1000); // now - 20 phút

      // Lấy các order PENDING, được tạo trước ngưỡng giữ chỗ, và suất chiếu vẫn chưa bắt đầu
      const expiredOrders = await this.orderRepository.find({
        where: {
          status: StatusOrder.PENDING,
          order_date: LessThan(holdThreshold),
        },
        relations: [
          'transaction',
          'orderDetails',
          'orderDetails.ticket',
          'orderDetails.ticket.seat',
          'orderDetails.schedule',
        ],
      });

      const ordersToFail: Order[] = [];

      for (const order of expiredOrders) {
        // Kiểm tra xem suất chiếu vẫn chưa bắt đầu
        const firstSchedule = order.orderDetails?.[0]?.schedule;
        if (!firstSchedule || new Date(firstSchedule.start_movie_time) <= now) continue;

        this.logger.log(`Order ${order.id} is expired and eligible to be failed.`);

        // Cập nhật trạng thái ghế thành NOT_YET
        for (const detail of order.orderDetails) {
          const schedule = detail.ticket?.schedule;
          const seat = detail.ticket?.seat;

          if (schedule && seat) {
            const scheduleSeat = await this.scheduleSeatRepository.findOne({
              where: {
                schedule: { id: schedule.id },
                seat: { id: seat.id },
              },
            });

            if (scheduleSeat) {
              scheduleSeat.status = StatusSeat.NOT_YET;
              await this.scheduleSeatRepository.save(scheduleSeat);
              this.logger.log(
                `Seat ${seat.id} in schedule ${schedule.id} marked as NOT_YET`,
              );
            }
          }
        }

        // Cập nhật trạng thái order
        order.status = StatusOrder.FAILED;
        if (order.transaction) {
          order.transaction.status = StatusOrder.FAILED;
        }

        ordersToFail.push(order);
      }

      // Lưu tất cả đơn hàng đã bị cập nhật
      if (ordersToFail.length > 0) {
        await this.orderRepository.save(ordersToFail);
        this.logger.log(`Marked ${ordersToFail.length} orders as FAILED`);
      } else {
        this.logger.log('No orders to update');
      }
    } catch (error) {
      this.logger.error('Error while checking expired pending orders', error);
    }
  }
}
