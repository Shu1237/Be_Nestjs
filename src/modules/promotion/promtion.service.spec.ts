import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PromotionService } from './promotion.service';
import { Promotion } from 'src/database/entities/promotion/promotion';
import { Repository } from 'typeorm';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';

describe('PromotionService', () => {
  let service: PromotionService;
  let mockRepo: Partial<Repository<Promotion>>;

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionService,
        { provide: getRepositoryToken(Promotion), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PromotionService>(PromotionService);
  });

  describe('1.createPromotion', () => {
    const dto = {
      title: 'Summer Sale 2025',
      detail: 'Up to 50% off',
      discount: '50%',
      code: 'SUMMER2025',
      exchange: 10,
      promotion_type_id: 1,
      start_time: '2099-07-01T00:00:00+07:00',
      end_time: '2099-07-10T00:00:00+07:00',
      is_active: true,
    };

    it('✅ 1.1 should create a promotion successfully', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.create as jest.Mock).mockReturnValue({ ...dto });
      (mockRepo.save as jest.Mock).mockResolvedValue({ ...dto });
      const result = await service.createPromotion(dto as any);
      expect(result).toEqual({ msg: 'Promotion created successfully' });
    });

    it('❌ 1.2 should throw BadRequestException if code exists', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        code: dto.code,
      });
      await expect(service.createPromotion(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ 1.3 should throw BadRequestException if end_time <= now', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      const invalidDto = { ...dto, end_time: '2000-01-01T00:00:00+07:00' };
      await expect(service.createPromotion(invalidDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ 1.4 should throw BadRequestException if start_time >= end_time', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
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

  describe('2.getPromotionById', () => {
    it('✅ 2.1 should return promotion if found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        is_active: true,
      });
      const result = await service.getPromotionById(1);
      expect(result).toEqual({ id: 1, is_active: true });
    });

    it('❌ 2.2 should throw NotFoundException if not found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.getPromotionById(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('3.updatePromotion', () => {
    const oldPromo = {
      id: 1,
      code: 'OLDCODE',
      is_active: true,
      promotionType: { id: 1 },
    };

    it('✅ 3.1 should update a promotion successfully', async () => {
      service.getPromotionById = jest.fn().mockResolvedValue({ ...oldPromo });
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.save as jest.Mock).mockResolvedValue({});
      const dto = { title: 'New', code: 'OLDCODE', promotion_type_id: 2 };
      const result = await service.updatePromotion(1, dto as any);
      expect(result).toEqual({ msg: 'Promotion updated successfully' });
    });

    it('❌ 3.2 should throw BadRequestException if new code already exists', async () => {
      service.getPromotionById = jest.fn().mockResolvedValue({ ...oldPromo });
      (mockRepo.findOne as jest.Mock).mockResolvedValue({
        id: 99,
        code: 'NEWCODE',
      });
      const dto = { code: 'NEWCODE' };
      await expect(service.updatePromotion(1, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ 3.3 should throw BadRequestException if start_time >= end_time', async () => {
      service.getPromotionById = jest.fn().mockResolvedValue({ ...oldPromo });
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      const dto = {
        start_time: '2099-07-10T00:00:00+07:00',
        end_time: '2099-07-01T00:00:00+07:00',
      };
      await expect(service.updatePromotion(1, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('4.togglePromotionStatus', () => {
    it('✅ 4.1 should activate promotion when currently inactive', async () => {
      const mockPromotion = {
        id: 1,
        title: 'Test Promotion',
        is_active: false,
        promotionType: { id: 1, name: 'Discount' },
      };

      (mockRepo.findOne as jest.Mock).mockResolvedValue(mockPromotion);
      (mockRepo.save as jest.Mock).mockResolvedValue({
        ...mockPromotion,
        is_active: true,
      });

      const result = await service.togglePromotionStatus(1);

      expect(result.msg).toBe('Promotion activated successfully');
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
      );
    });

    it('✅ 4.2 should deactivate promotion when currently active', async () => {
      const mockPromotion = {
        id: 1,
        title: 'Test Promotion',
        is_active: true,
        promotionType: { id: 1, name: 'Discount' },
      };

      (mockRepo.findOne as jest.Mock).mockResolvedValue(mockPromotion);
      (mockRepo.save as jest.Mock).mockResolvedValue({
        ...mockPromotion,
        is_active: false,
      });

      const result = await service.togglePromotionStatus(1);

      expect(result.msg).toBe('Promotion deactivated successfully');
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
      );
    });

    it('❌ 4.3 should throw NotFoundException if promotion not found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.togglePromotionStatus(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('❌ 4.4 should handle database error during toggle', async () => {
      const mockPromotion = {
        id: 1,
        title: 'Test Promotion',
        is_active: true,
        promotionType: { id: 1, name: 'Discount' },
      };

      (mockRepo.findOne as jest.Mock).mockResolvedValue(mockPromotion);
      (mockRepo.save as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.togglePromotionStatus(1)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
