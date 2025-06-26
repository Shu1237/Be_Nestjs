import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from 'src/database/entities/promotion/promotion';

@Injectable()
export class PromotionCronService {
  private readonly logger = new Logger(PromotionCronService.name);
  private isRunning = false;

  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
  ) {}

  @Cron('0 */2 * * *', {
    name: 'promotion-check',
    // timeZone: 'Asia/Ho_Chi_Minh',
  })
  async processPromotions(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    const now = new Date();

    try {
      // Kích hoạt khuyến mãi đủ điều kiện
      const promotionsToActivate = await this.promotionRepository
        .createQueryBuilder('promo')
        .where('promo.start_time <= :now', { now })
        .andWhere('promo.is_active = false')
        .andWhere('(promo.end_time IS NULL OR promo.end_time > :now)', { now })
        .getMany();

      if (promotionsToActivate.length > 0) {
        const ids = promotionsToActivate.map((p) => p.id);
        const codes = promotionsToActivate.map((p) => p.code).join(', ');

        await this.promotionRepository
          .createQueryBuilder()
          .update(Promotion)
          .set({ is_active: true })
          .whereInIds(ids)
          .execute();

        this.logger.log(`Activated promotions: ${codes}`);
      }

      // Hủy kích hoạt các khuyến mãi đã hết hạn
      const promotionsToDeactivate = await this.promotionRepository
        .createQueryBuilder('promo')
        .where('promo.end_time <= :now', { now })
        .andWhere('promo.is_active = true')
        .getMany();

      if (promotionsToDeactivate.length > 0) {
        const ids = promotionsToDeactivate.map((p) => p.id);
        const codes = promotionsToDeactivate.map((p) => p.code).join(', ');

        await this.promotionRepository
          .createQueryBuilder()
          .update(Promotion)
          .set({ is_active: false })
          .whereInIds(ids)
          .execute();

        this.logger.log(` Deactivated promotions: ${codes}`);
      }
    } catch (error) {
      this.logger.error('Error processing promotions:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async manualPromotionCheck(): Promise<{
    message: string;
    timestamp: string;
  }> {
    await this.processPromotions();
    return {
      message: 'Manual check completed',
      timestamp: new Date().toLocaleString('vi-VN', {
        // timeZone: 'Asia/Ho_Chi_Minh',
      }),
    };
  }
}
