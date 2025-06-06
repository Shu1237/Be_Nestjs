import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Promotion } from 'src/typeorm/entities/promotion/promotion';
import { Member } from 'src/typeorm/entities/user/member';
import { User } from 'src/typeorm/entities/user/user';
import { ChangePromotionType, CreatePromotionType, JWTUserType } from 'src/utils/type';
import { Repository } from 'typeorm';
import { ChangePromotionDto } from './dto/change-promotion.dto';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) { }

  async getAllPromotions() {
    return this.promotionRepository.find();
  }

  // async createPromotion(createPromotionDto: CreatePromotionType) {
  //   const existing = await this.promotionRepository.findOne({
  //     where: { code: createPromotionDto.code },
  //   });

  //   if (existing) {
  //     throw new BadRequestException(`Promotion code "${createPromotionDto.code}" already exists`);
  //   }

  //   const promotion = this.promotionRepository.create({
  //     ...createPromotionDto,
  //     exchange: createPromotionDto.exchange
  //   });
  //   return this.promotionRepository.save(promotion);
  // }

  async getPromotionById(id: number) {
    const promotion = await this.promotionRepository.findOneBy({ id });
    if (!promotion) throw new NotFoundException('Promotion not found');
    return promotion;
  }

  // async updatePromotion(id: number, updatePromotionDto: UpdatePromotionDto) {
  //   await this.promotionRepository.update(id, updatePromotionDto);
  //   return this.getPromotionById(id);
  // }

  async deletePromotion(id: number) {
    return this.promotionRepository.delete(id);
  }

  async deleteSoftPromotion(id: number) {
    return this.promotionRepository.update(id, { is_active: false });
  }

  async changePromotion(body: ChangePromotionType, user: JWTUserType) {
    const userData = await this.userRepository.findOne({
      where: { id: user.account_id },
      relations: ['member'],
    });
    if (!userData) throw new NotFoundException('User not found');

    const promotion = await this.promotionRepository.findOne({
      where: { id: body.id, is_active: true },
    });
    if (!promotion) throw new NotFoundException('Promotion not found or inactive');

    const now = new Date();
    if (
      (promotion.start_time && now < promotion.start_time) ||
      (promotion.end_time && now > promotion.end_time)
    ) {
      throw new BadRequestException('Promotion is not active during this period');
    }

    if (!userData.member) {
      throw new BadRequestException('User does not have a member account');
    }
    if (Number(userData.member.score) < Number(promotion.exchange)) {
      throw new BadRequestException('Insufficient points to exchange for this promotion');
    }
    // Deduct points from member
    const newScore = (Number(userData.member.score) - Number(promotion.exchange))
     userData.member.score = newScore;
     await this.memberRepository.save(userData.member);

    return {
      msg: 'Exchange successfully',
    };
  }
}
