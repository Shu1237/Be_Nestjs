import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Promotion } from 'src/database/entities/promotion/promotion';
import { Repository } from 'typeorm';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { PromotionPaginationDto } from 'src/common/pagination/dto/promotion/promotionPagination.dto';
import { applyCommonFilters } from 'src/common/pagination/applyCommonFilters';
import { promotionFieldMapping } from 'src/common/pagination/fillters/promtion-field-mapping';
import { applySorting } from 'src/common/pagination/apply_sort';
import { applyPagination } from 'src/common/pagination/applyPagination';
import { buildPaginationResponse } from 'src/common/pagination/pagination-response';
import { PromotionType } from 'src/database/entities/promotion/promtion_type';
@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
  ) {}
  async getAllPromotionsUser(): Promise<Promotion[]> {
    return await this.promotionRepository.find({
      where: { is_active: true },
      relations: ['promotionType'],
    });
  }
  async getAllPromotions(fillters: PromotionPaginationDto) {
    const qb = this.promotionRepository
      .createQueryBuilder('promotion')
      .leftJoinAndSelect('promotion.promotionType', 'promotionType');

    applyCommonFilters(qb, fillters, promotionFieldMapping);

    const allowedFields = ['promotion.exchange', 'promotionType.id'];
    applySorting(
      qb,
      fillters.sortBy,
      fillters.sortOrder,
      allowedFields,
      'promotion.id',
    );

    applyPagination(qb, {
      page: fillters.page,
      take: fillters.take,
    });
    const [promotions, total] = await qb.getManyAndCount();
    const counts: { activeCount: number; deletedCount: number } =
      (await this.promotionRepository
        .createQueryBuilder('promotion')
        .select([
          `SUM(CASE WHEN promotion.is_active = false THEN 1 ELSE 0 END) AS activeCount`,
          `SUM(CASE WHEN promotion.is_active = true THEN 1 ELSE 0 END) AS deletedCount`,
        ])
        .getRawOne()) || { activeCount: 0, deletedCount: 0 };

    const activeCount = counts.activeCount || 0;
    const deletedCount = counts.deletedCount || 0;

    return buildPaginationResponse(promotions, {
      total,
      page: fillters.page,
      take: fillters.take,
      activeCount,
      deletedCount,
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

    const promotionType: Partial<PromotionType> = { id: dto.promotion_type_id };

    const promo = this.promotionRepository.create({
      ...dto,
      start_time: dto.start_time ? new Date(dto.start_time) : undefined,
      end_time: dto.end_time ? new Date(dto.end_time) : undefined,
      is_active: dto.is_active ?? true,
      promotionType: promotionType as PromotionType,
    });

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
    if (dto.promotion_type_id !== undefined) {
      promo.promotionType = { id: dto.promotion_type_id } as PromotionType;
    }
    await this.promotionRepository.save(promo);
    return { msg: 'Promotion updated successfully' };
  }

  async togglePromotionStatus(id: number) {
    const promotion = await this.promotionRepository.findOne({
      where: { id },
      relations: ['promotionType'],
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    // Toggle the is_active status
    promotion.is_active = !promotion.is_active;
    await this.promotionRepository.save(promotion);

    const action = promotion.is_active ? 'activated' : 'deactivated';
    return { msg: `Promotion ${action} successfully` };
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
