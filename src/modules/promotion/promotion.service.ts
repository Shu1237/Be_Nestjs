import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Promotion } from 'src/database/entities/promotion/promotion';
import { ChangePromotionType, JWTUserType } from 'src/common/utils/type';
import { Repository } from 'typeorm';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';


@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
  ) {}

  async getAllPromotions() {
    return this.promotionRepository.find({
      where: { is_active: true },
    });
  }

  async createPromotion(dto: CreatePromotionDto) {
    const exist = await this.promotionRepository.findOne({
      where: { code: dto.code },
    });
    if (exist) {
      throw new BadRequestException('Promotion code already exists');
    }

    this.validateDates(dto.start_time, dto.end_time, dto.is_active);

    const promo = this.promotionRepository.create(dto);
    await this.promotionRepository.save(promo);
    return { msg: 'Promotion created successfully' };
  }

  async getPromotionById(id: number) {
    const promotion = await this.promotionRepository.findOne({
      where: { id, is_active: true },
    });
    if (!promotion) throw new NotFoundException('Promotion not found');
    return promotion;
  }

  async updatePromotion(id: number, dto: UpdatePromotionDto) {
    const promo = await this.getPromotionById(id);

    if (dto.code) {
      const exist = await this.promotionRepository.findOne({
        where: { code: dto.code },
      });
      if (exist && exist.id !== id) {
        throw new BadRequestException(
          `Promotion code "${dto.code}" already exists`,
        );
      }
    }

    this.validateDates(dto.start_time, dto.end_time, dto.is_active);

    Object.assign(promo, dto);
    await this.promotionRepository.save(promo);
    return { msg: 'Promotion updated successfully' };
  }

  // async deletePromotion(id: number) {
  //   const promotion = await this.promotionRepository.findOne({
  //     where: { id },
  //   });
  //   if (!promotion) {
  //     throw new NotFoundException('Promotion not found');
  //   }
  //   await this.promotionRepository.remove(promotion);
  //   return { msg: 'Promotion deleted successfully' };
  // }

  async deleteSoftPromotion(id: number) {
    const promotion = await this.promotionRepository.findOne({ where: { id } });
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    if (!promotion.is_active) {
      throw new BadRequestException('Promotion is already deleted');
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
  private validateDates(
    start_time?: string,
    end_time?: string,
    is_active?: boolean,
  ) {
    if (start_time && end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);
      if (start >= end) {
        throw new BadRequestException('start_time must be before end_time');
      }
    }

    if (is_active !== false && end_time) {
      const now = new Date();
      const end = new Date(end_time);
      if (end <= now) {
        throw new BadRequestException('end_time must be in the future');
      }
    }
  }
}
