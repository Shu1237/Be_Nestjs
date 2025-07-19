import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrderService } from 'src/modules/order/order.service';


@Injectable()

export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  constructor(private readonly orderService: OrderService) { }

  @Cron('0 0 * * *', {
    name: 'daily-order-stats',
  })
  async handleDailyOrderStats() {
    // this.logger.log('Starting daily order statistics check');
    // const result = await this.orderService.checkAllOrdersStatusByGateway();
    // this.logger.log('Daily order statistics check completed');
    // if (result) {
    //   this.logger.log('Order statistics by payment method:', result);
    // } else {
    //   this.logger.log('No orders found for today');
    // }
  }
}

