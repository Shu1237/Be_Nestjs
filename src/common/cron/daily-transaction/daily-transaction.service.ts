import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PaymentGateway } from 'src/common/enums/payment_gatewat.enum';
import { OrderService } from 'src/modules/order/order.service';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private readonly orderService: OrderService) {}

  @Cron('0 0 * * *', {
    name: 'daily-order-stats',
  })
  async handleDailyOrderStats() {
    this.logger.log(' [CRON] Starting daily order statistics check...');

    try {
      const result = await this.orderService.checkAllOrdersStatusByGateway();

      if (result && Object.keys(result).length > 0) {
        this.logger.log(
          ' [CRON] Daily order statistics check completed. Summary:',
        );
        this.logger.log(this.formatStatistics(result));
      } else {
        this.logger.warn(' [CRON] No orders found for today.');
      }
    } catch (error) {
      this.logger.error(
        ' [CRON] Error during daily order statistics check',
        error.stack,
      );
    }
  }

  private formatStatistics(
    result: Record<
      string,
      { totalSuccess: number; totalFailed: number; totalRevenue: number }
    >,
  ): string {
    const lines = ['\n📌 Order Statistics By Payment Gateway:'];
    for (const [gateway, stats] of Object.entries(result)) {
      lines.push(
        `- ${gateway}: ✅ Success: ${stats.totalSuccess} | ❌ Failed: ${stats.totalFailed} | 💰 Revenue: ${this.formatCurrency(stats.totalRevenue, gateway as PaymentGateway)}`,
      );
    }
    return lines.join('\n');
  }

  private formatCurrency(amount: number, gateway: PaymentGateway): string {
    const currency =
      {
        [PaymentGateway.MOMO]: 'VND',
        [PaymentGateway.ZALOPAY]: 'VND',
        [PaymentGateway.CASH]: 'VND',
        [PaymentGateway.VNPAY]: 'VND',
        [PaymentGateway.PAYPAL]: 'USD',
        [PaymentGateway.VISA]: 'USD',
      }[gateway] || 'VND'; // fallback là VND

    return amount.toLocaleString(currency === 'USD' ? 'en-US' : 'vi-VN', {
      style: 'currency',
      currency,
    });
  }
}
