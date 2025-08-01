import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PromotionService } from './promotion.service';
import { Promotion } from 'src/database/entities/promotion/promotion';
import { PromotionType } from 'src/database/entities/promotion/promtion_type';
import { Repository } from 'typeorm';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';

describe('PromotionService', () => {
  let service: PromotionService;
  let mockPromotionRepo: Partial<Repository<Promotion>>;
  let mockPromotionTypeRepo: Partial<Repository<PromotionType>>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getRawOne: jest.fn(),
  };

  beforeEach(async () => {
    mockPromotionRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    mockPromotionTypeRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionService,
        { provide: getRepositoryToken(Promotion), useValue: mockPromotionRepo },
        { provide: getRepositoryToken(PromotionType), useValue: mockPromotionTypeRepo },
      ],
    }).compile();

    service = module.get<PromotionService>(PromotionService);
  });

  describe('1.getAllPromotionsUser', () => {
    it('✅ 1.1 should return active promotions within valid time range', async () => {
      const mockPromotions = [
        {
          id: 1,
          title: 'Summer Sale',
          is_active: true,
          start_time: new Date('2024-01-01'),
          end_time: new Date('2024-12-31'),
          promotionType: { id: 1, type: 'percentage' },
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockPromotions);

      const result = await service.getAllPromotionsUser();

      expect(result).toEqual(mockPromotions);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'promotion.is_active = :isActive',
        { isActive: true }
      );
    });

    it('✅ 1.2 should return empty array when no valid promotions', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.getAllPromotionsUser();

      expect(result).toEqual([]);
    });
  });

  describe('2.createPromotion', () => {
    const dto = {
      title: 'Summer Sale 2025',
      detail: 'Up to 50% off',
      discount: '50%',
      code: 'SUMMER2025',
      exchange: 50,
      promotion_type_id: 1,
      start_time: '2099-07-01T00:00:00+07:00',
      end_time: '2099-07-10T00:00:00+07:00',
      is_active: true,
    };

    const mockPromotionType = {
      id: 1,
      type: 'percentage',
    };

    it('✅ 2.1 should create a promotion successfully', async () => {
      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockPromotionTypeRepo.findOne as jest.Mock).mockResolvedValue(mockPromotionType);
      (mockPromotionRepo.create as jest.Mock).mockReturnValue({ ...dto });
      (mockPromotionRepo.save as jest.Mock).mockResolvedValue({ ...dto });

      const result = await service.createPromotion(dto as any);

      expect(result).toEqual({ msg: 'Promotion created successfully' });
      expect(mockPromotionTypeRepo.findOne).toHaveBeenCalledWith({
        where: { id: dto.promotion_type_id },
      });
    });

    it('❌ 2.2 should throw BadRequestException if code exists', async () => {
      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        code: dto.code,
      });

      await expect(service.createPromotion(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ 2.3 should throw BadRequestException if promotion type not found', async () => {
      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockPromotionTypeRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.createPromotion(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ 2.4 should throw BadRequestException if percentage discount > 100', async () => {
      const invalidDto = { ...dto, exchange: 150 };
      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockPromotionTypeRepo.findOne as jest.Mock).mockResolvedValue(mockPromotionType);

      await expect(service.createPromotion(invalidDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ 2.5 should throw BadRequestException if amount discount <= 0', async () => {
      const amountPromotionType = { id: 2, type: 'amount' };
      const invalidDto = { ...dto, exchange: 0, promotion_type_id: 2 };
      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockPromotionTypeRepo.findOne as jest.Mock).mockResolvedValue(amountPromotionType);

      await expect(service.createPromotion(invalidDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ 2.6 should throw BadRequestException if end_time <= now for active promotion', async () => {
      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockPromotionTypeRepo.findOne as jest.Mock).mockResolvedValue(mockPromotionType);
      const invalidDto = { ...dto, end_time: '2000-01-01T00:00:00+07:00' };

      await expect(service.createPromotion(invalidDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ 2.7 should throw BadRequestException if start_time >= end_time', async () => {
      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockPromotionTypeRepo.findOne as jest.Mock).mockResolvedValue(mockPromotionType);
      const invalidDto = {
        ...dto,
        start_time: '2099-07-10T00:00:00+07:00',
        end_time: '2099-07-01T00:00:00+07:00',
      };

      await expect(service.createPromotion(invalidDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('3.getPromotionById', () => {
    it('✅ 3.1 should return promotion if found', async () => {
      const mockPromotion = {
        id: 1,
        is_active: true,
      };

      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(mockPromotion);

      const result = await service.getPromotionById(1);

      expect(result).toEqual(mockPromotion);
      expect(mockPromotionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1, is_active: true },
      });
    });

    it('❌ 3.2 should throw NotFoundException if not found', async () => {
      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.getPromotionById(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('4.updatePromotion', () => {
    const oldPromo = {
      id: 1,
      code: 'OLDCODE',
      is_active: true,
      promotionType: { id: 1 },
    };

    const mockPromotionType = {
      id: 1,
      type: 'percentage',
    };

    it('✅ 4.1 should update a promotion successfully', async () => {
      service.getPromotionById = jest.fn().mockResolvedValue({ ...oldPromo });
      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockPromotionTypeRepo.findOne as jest.Mock).mockResolvedValue(mockPromotionType);
      (mockPromotionRepo.save as jest.Mock).mockResolvedValue({});

      const dto = { title: 'New', code: 'OLDCODE', promotion_type_id: 1 };
      const result = await service.updatePromotion(1, dto as any);

      expect(result).toEqual({ msg: 'Promotion updated successfully' });
    });

    it('❌ 4.2 should throw BadRequestException if new code already exists', async () => {
      service.getPromotionById = jest.fn().mockResolvedValue({ ...oldPromo });
      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue({
        id: 99,
        code: 'NEWCODE',
      });

      const dto = { code: 'NEWCODE' };
      await expect(service.updatePromotion(1, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ 4.3 should throw BadRequestException if promotion type not found', async () => {
      service.getPromotionById = jest.fn().mockResolvedValue({ ...oldPromo });
      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockPromotionTypeRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      const dto = { promotion_type_id: 999 };
      await expect(service.updatePromotion(1, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ 4.4 should throw BadRequestException if start_time >= end_time', async () => {
      service.getPromotionById = jest.fn().mockResolvedValue({ ...oldPromo });
      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      const dto = {
        start_time: '2099-07-10T00:00:00+07:00',
        end_time: '2099-07-01T00:00:00+07:00',
      };

      await expect(service.updatePromotion(1, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('5.togglePromotionStatus', () => {
    it('✅ 5.1 should activate promotion when currently inactive', async () => {
      const mockPromotion = {
        id: 1,
        title: 'Test Promotion',
        is_active: false,
        promotionType: { id: 1, type: 'percentage' },
      };

      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(mockPromotion);
      (mockPromotionRepo.save as jest.Mock).mockResolvedValue({
        ...mockPromotion,
        is_active: true,
      });

      const result = await service.togglePromotionStatus(1);

      expect(result.msg).toBe('Promotion activated successfully');
      expect(mockPromotionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
      );
    });

    it('✅ 5.2 should deactivate promotion when currently active', async () => {
      const mockPromotion = {
        id: 1,
        title: 'Test Promotion',
        is_active: true,
        promotionType: { id: 1, type: 'percentage' },
      };

      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(mockPromotion);
      (mockPromotionRepo.save as jest.Mock).mockResolvedValue({
        ...mockPromotion,
        is_active: false,
      });

      const result = await service.togglePromotionStatus(1);

      expect(result.msg).toBe('Promotion deactivated successfully');
      expect(mockPromotionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
      );
    });

    it('❌ 5.3 should throw NotFoundException if promotion not found', async () => {
      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.togglePromotionStatus(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('❌ 5.4 should handle database error during toggle', async () => {
      const mockPromotion = {
        id: 1,
        title: 'Test Promotion',
        is_active: true,
        promotionType: { id: 1, type: 'percentage' },
      };

      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(mockPromotion);
      (mockPromotionRepo.save as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.togglePromotionStatus(1)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
