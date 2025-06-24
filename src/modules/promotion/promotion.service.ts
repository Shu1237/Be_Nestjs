import {Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Promotion } from 'src/database/entities/promotion/promotion';

import { User } from 'src/database/entities/user/user';
import { ChangePromotionType, JWTUserType } from 'src/common/utils/type';
import { Repository } from 'typeorm';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { TimeUtil } from 'src/common/utils/time.util';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
  ) {}

  async getAllPromotions() {
    return this.promotionRepository.find({
      where: { is_active: true },
    });
  }

  async createPromotion(createPromotionDto: CreatePromotionDto) {
    const existingPromotion = await this.promotionRepository.findOne({
      where: { code: createPromotionDto.code },
    });

    if (existingPromotion) {
      throw new BadRequestException('Promotion code already exists');
    }

    const promotion = this.promotionRepository.create({
      ...createPromotionDto,
      start_time: TimeUtil.toUTCDateFromVietnamTime(createPromotionDto.start_time|| new Date()),
      end_time: TimeUtil.toUTCDateFromVietnamTime(createPromotionDto.end_time|| new Date()),
    });
    await this.promotionRepository.save(promotion);
    return { msg: 'Promotion created successfully' };
  }

  async getPromotionById(id: number) {
    const promotion = await this.promotionRepository.findOne({
      where: { id, is_active: true },
    });
    if (!promotion) throw new NotFoundException('Promotion not found');
    return promotion;
  }

  async updatePromotion(id: number, updatePromotionDto: UpdatePromotionDto) {
    const promotion = await this.getPromotionById(id);

    if (updatePromotionDto.code) {
      const existing = await this.promotionRepository.findOne({
        where: { code: updatePromotionDto.code },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Promotion code "${updatePromotionDto.code}" already exists`,
        );
      }
    }

    Object.assign(promotion, updatePromotionDto);
    await this.promotionRepository.save({
      ...promotion,
      start_time: TimeUtil.toUTCDateFromVietnamTime(
        updatePromotionDto.start_time ?? promotion.start_time ?? new Date()
      ),
      end_time: TimeUtil.toUTCDateFromVietnamTime(
        updatePromotionDto.end_time ?? promotion.end_time ?? new Date()
      ),
    });
    return { msg: 'Promotion updated successfully' };
  }

  async deletePromotion(id: number) {
    const promotion = await this.promotionRepository.findOne({
      where: { id },
    });
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }
    await this.promotionRepository.remove(promotion);
    return { msg: 'Promotion deleted successfully' };
  }

  async deleteSoftPromotion(id: number) {
    const promotion = await this.promotionRepository.findOne({
      where: { id },
    });
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }
    promotion.is_active = false;
    await this.promotionRepository.save(promotion);
    return { msg: 'Promotion deleted successfully' };
  }

  async changePromotion(body: ChangePromotionType, user: JWTUserType) {
    // const userData = await this.userRepository.findOne({
    //   where: { id: user.account_id },
    //   relations: ['member'],
    // });
    // if (!userData) throw new NotFoundException('User not found');

    // const promotion = await this.promotionRepository.findOne({
    //   where: { id: body.id, is_active: true },
    // });
    // if (!promotion)
    //   throw new NotFoundException('Promotion not found or inactive');

    // const now = new Date();
    // if (
    //   (promotion.start_time && now < promotion.start_time) ||
    //   (promotion.end_time && now > promotion.end_time)
    // ) {
    //   throw new BadRequestException(
    //     'Promotion is not active during this period',
    //   );
    // }

    // if (!userData.member) {
    //   throw new BadRequestException('User does not have a member account');
    // }
    // if (Number(userData.member.score) < Number(promotion.exchange)) {
    //   throw new BadRequestException(
    //     'Insufficient points to exchange for this promotion',
    //   );
    // }
    // // Deduct points from member
    // const newScore = Number(userData.member.score) - Number(promotion.exchange);
    // userData.member.score = newScore;
    // await this.memberRepository.save(userData.member);

    // return {
    //   msg: 'Exchange successfully',
    // };
  }
}
