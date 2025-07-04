import { Module } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { PromotionController } from './promotion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user/user';
import { Promotion } from 'src/database/entities/promotion/promotion';
import { PromotionCronService } from 'src/common/cron/promotion/PromotionCron.Service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Promotion])],
  controllers: [PromotionController],
  providers: [PromotionService, PromotionCronService],
})
export class PromotionModule {}
