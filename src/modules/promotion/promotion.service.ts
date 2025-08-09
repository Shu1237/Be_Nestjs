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
    @InjectRepository(PromotionType)
    private readonly promotionTypeRepository: Repository<PromotionType>,
  ) {}

  async getAllPromotionsUser(): Promise<Promotion[]> {
    const now = new Date();
    
    return await this.promotionRepository
      .createQueryBuilder('promotion')
      .leftJoinAndSelect('promotion.promotionType', 'promotionType')
      .where('promotion.is_active = :isActive', { isActive: true })
      .andWhere(
        '(promotion.start_time IS NULL OR promotion.start_time <= :now)',
        { now }
      )
      .andWhere(
        '(promotion.end_time IS NULL OR promotion.end_time >= :now)',
        { now }
      )
      .getMany();
  }

  async getAllPromotions(fillters: PromotionPaginationDto) : Promise<ReturnType<typeof buildPaginationResponse>> {
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

  async createPromotion(dto: CreatePromotionDto): Promise<{ msg: string }> {
    // Validate promotion code uniqueness
    const exist = await this.promotionRepository.findOne({
      where: { code: dto.code },
    });
    if (exist) {
      throw new BadRequestException('Promotion code already exists');
    }

    // Validate promotion type exists
    await this.validatePromotionType(dto.promotion_type_id);

    // Validate dates
    this.validateDates(dto.start_time, dto.end_time, dto.is_active);

    // Validate exchange value based on promotion type
    await this.validateExchangeValue(dto.exchange, dto.promotion_type_id);

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

  async getPromotionById(id: number) : Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({
      where: { id, is_active: true },
    });
    if (!promotion) throw new NotFoundException('Promotion not found');
    return promotion;
  }

  async updatePromotion(id: number, dto: UpdatePromotionDto): Promise<{ msg: string }> {
    const promo = await this.getPromotionById(id);

    // Validate promotion code uniqueness (if provided)
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

    // Validate promotion type exists (if provided)
    if (dto.promotion_type_id !== undefined) {
      await this.validatePromotionType(dto.promotion_type_id);
    }

    // Validate dates
    this.validateDates(dto.start_time, dto.end_time, dto.is_active);

    // Validate exchange value (if provided)
    if (dto.exchange !== undefined && dto.promotion_type_id !== undefined) {
      await this.validateExchangeValue(dto.exchange, dto.promotion_type_id);
    }

    Object.assign(promo, dto);
    if (dto.promotion_type_id !== undefined) {
      promo.promotionType = { id: dto.promotion_type_id } as PromotionType;
    }
    await this.promotionRepository.save(promo);
    return { msg: 'Promotion updated successfully' };
  }

  async togglePromotionStatus(id: number) : Promise<{ msg: string }> {
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

  private async validatePromotionType(promotionTypeId: number) : Promise<void> {
    const promotionType = await this.promotionTypeRepository.findOne({
      where: { id: promotionTypeId },
    });
    if (!promotionType) {
      throw new BadRequestException(
        `Promotion type with ID ${promotionTypeId} not found`,
      );
    }
  }

  private async validateExchangeValue(
    exchange: number,
    promotionTypeId: number,
  ) : Promise<void> {
    const promotionType = await this.promotionTypeRepository.findOne({
      where: { id: promotionTypeId },
    });

    if (!promotionType) {
      throw new BadRequestException(
        `Promotion type with ID ${promotionTypeId} not found`,
      );
    }

    // Validate exchange points (must be positive for all promotion types)
    if (exchange <= 0) {
      throw new BadRequestException(
        'Exchange points must be greater than 0',
      );
    }
  }

  private validateDates(
    start_time?: string,
    end_time?: string,
    is_active?: boolean,
  ) {
    // Validate start_time and end_time relationship
    if (start_time && end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);

      if (start >= end) {
        throw new BadRequestException('start_time must be before end_time');
      }
    }

    // Validate end_time is in the future for active promotions
    if (is_active !== false && end_time) {
      const now = new Date();
      const end = new Date(end_time);
      if (end <= now) {
        throw new BadRequestException(
          'end_time must be in the future for active promotions',
        );
      }
    }

    // Validate start_time is not in the past for active promotions
    if (is_active !== false && start_time) {
      const now = new Date();
      const start = new Date(start_time);
      if (start < now) {
        throw new BadRequestException(
          'start_time cannot be in the past for active promotions',
        );
      }
    }
  }
}
