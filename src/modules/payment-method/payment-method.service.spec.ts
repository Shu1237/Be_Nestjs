import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from 'src/database/entities/order/payment-method';
import { PaymentMethodService } from './payment-method.service';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';

describe('PaymentMethodService', () => {
  let service: PaymentMethodService;
  let mockRepo: Partial<Repository<PaymentMethod>>;

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodService,
        { provide: getRepositoryToken(PaymentMethod), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PaymentMethodService>(PaymentMethodService);
  });

  describe('1.create', () => {
    it('✅ 1.1 should create a new payment method', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockRepo.create as jest.Mock).mockReturnValue({ name: 'Credit Card' });
      (mockRepo.save as jest.Mock).mockResolvedValue({ name: 'Credit Card' });

      await expect(service.create({ name: 'Credit Card' })).resolves.toEqual({
        msg: 'Payment method created successfully',
      });
      expect(mockRepo.create).toHaveBeenCalledWith({ name: 'Credit Card' });
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('❌ 1.2 should throw BadRequestException if name already exists', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, name: 'Credit Card' });
      await expect(service.create({ name: 'Credit Card' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('2.findOne', () => {
    it('✅ 2.1 should return the payment method if found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, name: 'Credit Card' });
      const result = await service.findOne(1);
      expect(result).toEqual({ id: 1, name: 'Credit Card' });
    });

    it('❌ 2.2 should throw NotFoundException if not found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('3.update', () => {
    it('✅ 3.1 should update a payment method', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, name: 'Credit Card' });
      (mockRepo.save as jest.Mock).mockResolvedValue({ id: 1, name: 'Bank Transfer' });

      const result = await service.update(1, { name: 'Bank Transfer' });
      expect(result).toEqual({ msg: 'Payment method updated successfully' });
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('❌ 3.2 should throw NotFoundException if not found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.update(1, { name: 'Bank Transfer' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('4.remove', () => {
    it('✅ 4.1 should delete a payment method', async () => {
      (mockRepo.delete as jest.Mock).mockResolvedValue({ affected: 1 });
      const result = await service.remove(1);
      expect(result).toEqual({ msg: 'Payment method deleted successfully' });
    });

    it('❌ 4.2 should throw NotFoundException if not found', async () => {
      (mockRepo.delete as jest.Mock).mockResolvedValue({ affected: 0 });
      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('5.softDelete', () => {
    it('✅ 5.1 should soft delete a payment method', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, name: 'Credit Card', is_deleted: false });
      (mockRepo.save as jest.Mock).mockResolvedValue({ id: 1, name: 'Credit Card', is_deleted: true });

      const result = await service.softDelete(1);
      expect(result).toEqual({ msg: 'Payment method soft deleted successfully' });
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('❌ 5.2 should throw NotFoundException if not found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.softDelete(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('6.restore', () => {
    it('✅ 6.1 should restore a soft-deleted payment method', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, is_deleted: true });
      (mockRepo.save as jest.Mock).mockResolvedValue({ id: 1, is_deleted: false });

      const result = await service.restore(1);
      expect(result).toEqual({ msg: 'Payment method restored successfully' });
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('❌ 6.2 should throw NotFoundException if not found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.restore(1)).rejects.toThrow(NotFoundException);
    });

    it('❌ 6.3 should throw BadRequestException if not soft-deleted', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, is_deleted: false });
      await expect(service.restore(1)).rejects.toThrow(BadRequestException);
    });
  });
});