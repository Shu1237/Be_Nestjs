import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { StatusSeat } from 'src/common/enums/status_seat.enum';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { Order } from 'src/database/entities/order/order';
import { Transaction } from 'src/database/entities/order/transaction';
import { Repository, LessThan } from 'typeorm';

@Injectable()
export class OrderCronService {
  private readonly logger = new Logger(OrderCronService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(ScheduleSeat)
    private readonly scheduleSeatRepository: Repository<ScheduleSeat>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  @Cron('*/20 * * * *', {
    name: 'check-pending-orders-to-fail',
  })
  async handleExpiredPendingOrders() {
    this.logger.log('Running cron to check expired pending orders...');

    const now = new Date();
    const expiredThreshold = new Date(now.getTime() - 20 * 60 * 1000); // 20 phút trước

    try {
      const expiredOrders = await this.orderRepository.find({
        where: {
          status: StatusOrder.PENDING,
          order_date: LessThan(expiredThreshold),
        },
        relations: [
          'transaction',
          'orderDetails',
          'orderDetails.ticket',
          'orderDetails.ticket.seat',
          'orderDetails.ticket.schedule',
        ],
      });

      const ordersToFail: Order[] = [];

      for (const order of expiredOrders) {
        this.logger.log(`→ Order ${order.id} is expired and will be marked as FAILED`);

        for (const detail of order.orderDetails) {
          const seat = detail.ticket?.seat;
          const ticketSchedule = detail.ticket?.schedule;

          if (seat && ticketSchedule) {
            const scheduleSeat = await this.scheduleSeatRepository.findOne({
              where: {
                seat: { id: seat.id },
                schedule: { id: ticketSchedule.id },
              },
            });

            if (scheduleSeat?.status === StatusSeat.BOOKED) {
              scheduleSeat.status = StatusSeat.NOT_YET;
              await this.scheduleSeatRepository.save(scheduleSeat);
              this.logger.log(`→ Seat ${seat.id} in schedule ${ticketSchedule.id} set to NOT_YET`);
            }
          }
        }

        // Đánh dấu order là FAILED
        order.status = StatusOrder.FAILED;
        
        // Cập nhật transaction status nếu có
        if (order.transaction) {
          order.transaction.status = StatusOrder.FAILED;
          this.logger.log(`→ Transaction ${order.transaction.id} for order ${order.id} set to FAILED`);
        }

        ordersToFail.push(order);
      }

      if (ordersToFail.length > 0) {
        // Save orders với cascade: true sẽ tự động save transaction
        await this.orderRepository.save(ordersToFail);
        
        // Đảm bảo transaction được save riêng biệt
        const transactionsToUpdate = ordersToFail
          .map(order => order.transaction)
          .filter(transaction => transaction !== null);
        
        if (transactionsToUpdate.length > 0) {
          await this.transactionRepository.save(transactionsToUpdate);
        }
        
        this.logger.log(`✅ Marked ${ordersToFail.length} expired orders as FAILED`);
      } else {
        this.logger.log('✅ No expired orders found to fail');
      }
    } catch (err) {
      this.logger.error(' Error while handling expired pending orders', err);
    }
  }
}
