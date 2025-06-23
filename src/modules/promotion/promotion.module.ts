import { Module } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { PromotionController } from './promotion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user/user';
import { Promotion } from 'src/database/entities/promotion/promotion';

@Module({
  imports: [
    TypeOrmModule.forFeature([ User, Promotion])
  ],
  controllers: [
    PromotionController
  ],
  providers: [PromotionService],
})
export class PromotionModule { }
