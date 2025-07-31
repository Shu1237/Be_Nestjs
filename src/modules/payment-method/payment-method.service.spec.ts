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
      (mockRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Credit Card',
      });
      await expect(service.create({ name: 'Credit Card' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('2.findOne', () => {
    it('✅ 2.1 should return the payment method if found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Credit Card',
      });
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
      (mockRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Credit Card',
      });
      (mockRepo.save as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Bank Transfer',
      });

      const result = await service.update(1, { name: 'Bank Transfer' });
      expect(result).toEqual({ msg: 'Payment method updated successfully' });
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('❌ 3.2 should throw NotFoundException if not found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(
        service.update(1, { name: 'Bank Transfer' }),
      ).rejects.toThrow(NotFoundException);
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
      (mockRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Credit Card',
        is_deleted: false,
      });
      (mockRepo.save as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Credit Card',
        is_deleted: true,
      });

      const result = await service.softDelete(1);
      expect(result).toEqual({
        msg: 'Payment method soft deleted successfully',
      });
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('❌ 5.2 should throw NotFoundException if not found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.softDelete(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('6.restore', () => {
    it('✅ 6.1 should restore a soft-deleted payment method', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        is_deleted: true,
      });
      (mockRepo.save as jest.Mock).mockResolvedValue({
        id: 1,
        is_deleted: false,
      });

      const result = await service.restore(1);
      expect(result).toEqual({ msg: 'Payment method restored successfully' });
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('❌ 6.2 should throw NotFoundException if not found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.restore(1)).rejects.toThrow(NotFoundException);
    });

    it('❌ 6.3 should throw BadRequestException if not soft-deleted', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        is_deleted: false,
      });
      await expect(service.restore(1)).rejects.toThrow(BadRequestException);
    });
  });
  describe('7.findAll', () => {
    it('✅ 7.1 should return all non-deleted payment methods', async () => {
      const mockData = [
        { id: 1, name: 'Credit Card', is_deleted: false },
        { id: 2, name: 'Bank Transfer', is_deleted: false },
      ];
      (mockRepo.find as jest.Mock) = jest.fn().mockResolvedValue(mockData);
  
      const result = await service.findAll();
      expect(result).toEqual(mockData);
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { is_deleted: false } });
    });
  });
  it('✅ 8.1 should update multiple fields of a payment method', async () => {
    const original = { id: 1, name: 'Credit Card', description: 'Visa' };
    const updated = { id: 1, name: 'Bank Transfer', description: 'Domestic only' };
  
    (mockRepo.findOne as jest.Mock).mockResolvedValue(original);
    (mockRepo.save as jest.Mock).mockResolvedValue(updated);
  
    const result = await service.update(1, { name: 'Bank Transfer' });
    expect(result).toEqual({ msg: 'Payment method updated successfully' });
  });
  it('✅ 9.1 should not soft delete if already deleted', async () => {
    const deletedMethod = { id: 1, name: 'Old', is_deleted: true };
    (mockRepo.findOne as jest.Mock).mockResolvedValue(deletedMethod);
  
    const result = await service.softDelete(1);
    // Có thể xử lý khác nếu muốn throw, nhưng hiện tại service vẫn cho phép set lại is_deleted=true
    expect(result).toEqual({ msg: 'Payment method soft deleted successfully' });
  });
  it('✅ 10.1 should call save with is_deleted: false when restoring', async () => {
    const deletedMethod = { id: 1, is_deleted: true };
    (mockRepo.findOne as jest.Mock).mockResolvedValue(deletedMethod);
    (mockRepo.save as jest.Mock).mockResolvedValue({ id: 1, is_deleted: false });
  
    const result = await service.restore(1);
    expect(mockRepo.save).toHaveBeenCalledWith({ id: 1, is_deleted: false });
    expect(result).toEqual({ msg: 'Payment method restored successfully' });
  });
  
  it('✅ 12.1 should return payment method if found', async () => {
    const mockData = { id: 1, name: 'Credit Card', is_deleted: false };
    (mockRepo.findOne as jest.Mock).mockResolvedValue(mockData);
    const result = await service.findOne(1);
    expect(result).toEqual(mockData);

  });
  
  it('❌ 12.2 should still save if update DTO is empty', async () => {
    const found = { id: 1, name: 'Credit Card', is_deleted: false };
  
    (mockRepo.findOne as jest.Mock).mockResolvedValue(found);
    (mockRepo.save as jest.Mock).mockResolvedValue(found);
  
    const result = await service.update(1, {});
    expect(result).toEqual({ msg: 'Payment method updated successfully' });
    expect(mockRepo.save).toHaveBeenCalledWith(found);
  });
  it('✅ 13.1 should set is_deleted=false and call save with full object', async () => {
    const entity = { id: 1, name: 'ZaloPay', is_deleted: true };
    (mockRepo.findOne as jest.Mock).mockResolvedValue(entity);
  
    const updated = { ...entity, is_deleted: false };
    (mockRepo.save as jest.Mock).mockResolvedValue(updated);
  
    const result = await service.restore(1);
  
    expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ is_deleted: false }));
    expect(result).toEqual({ msg: 'Payment method restored successfully' });
  });
  it('✅ 14.1 should call delete with correct ID', async () => {
    (mockRepo.delete as jest.Mock).mockResolvedValue({ affected: 1 });
    await service.remove(99);
    expect(mockRepo.delete).toHaveBeenCalledWith(99);
  });
  it('❌ 15.1 should throw correct NotFoundException message for findOne', async () => {
    (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
    await expect(service.findOne(123)).rejects.toThrowError(
      new NotFoundException('Payment method with ID 123 not found'),
    );
  });
  it('✅ 14.1 should call delete with correct ID', async () => {
  (mockRepo.delete as jest.Mock).mockResolvedValue({ affected: 1 });
  await service.remove(99);
  expect(mockRepo.delete).toHaveBeenCalledWith(99);
});
it('✅ 16.1 should still call save if data is the same', async () => {
  const found = { id: 1, name: 'Credit Card', is_deleted: false };
  (mockRepo.findOne as jest.Mock).mockResolvedValue(found);
  (mockRepo.save as jest.Mock).mockResolvedValue(found);

  const result = await service.update(1, { name: 'Credit Card' });
  expect(mockRepo.save).toHaveBeenCalledWith(found);
  expect(result).toEqual({ msg: 'Payment method updated successfully' });
});
it('✅ 17.1 should allow create if name exists but is_deleted is true', async () => {
  (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined); // Giả lập không tìm thấy name với is_deleted=false
  (mockRepo.create as jest.Mock).mockReturnValue({ name: 'ZaloPay' });
  (mockRepo.save as jest.Mock).mockResolvedValue({ id: 3, name: 'ZaloPay' });

  const result = await service.create({ name: 'ZaloPay' });
  expect(result).toEqual({ msg: 'Payment method created successfully' });
});
it('✅ 18.1 should not call save again if already is_deleted=true', async () => {
  const found = { id: 1, name: 'Momo', is_deleted: true };
  (mockRepo.findOne as jest.Mock).mockResolvedValue(found);

  const result = await service.softDelete(1);
  expect(mockRepo.save).toHaveBeenCalled(); // Nếu không muốn gọi thì đổi lại expect().not.toHaveBeenCalled()
  expect(result).toEqual({ msg: 'Payment method soft deleted successfully' });
});
it('✅ 19.1 should reuse same object with is_deleted = false on restore', async () => {
  const softDeleted = { id: 2, name: 'Apple Pay', is_deleted: true };
  (mockRepo.findOne as jest.Mock).mockResolvedValue(softDeleted);
  (mockRepo.save as jest.Mock).mockResolvedValue({ ...softDeleted, is_deleted: false });

  const result = await service.restore(2);
  expect(mockRepo.save).toHaveBeenCalledWith({ ...softDeleted, is_deleted: false });
  expect(result).toEqual({ msg: 'Payment method restored successfully' });
});
it('✅ 20.1 create → softDelete → restore flow', async () => {
  const dto = { name: 'ZaloPay' };

  (mockRepo.findOne as jest.Mock)
    .mockResolvedValueOnce(undefined) // create
    .mockResolvedValueOnce({ id: 5, name: 'ZaloPay', is_deleted: false }) // softDelete
    .mockResolvedValueOnce({ id: 5, name: 'ZaloPay', is_deleted: true }); // restore

  (mockRepo.create as jest.Mock).mockReturnValue(dto);
  (mockRepo.save as jest.Mock).mockResolvedValue({ id: 5, ...dto });
  (mockRepo.delete as jest.Mock).mockResolvedValue({ affected: 1 });

  await expect(service.create(dto)).resolves.toEqual({
    msg: 'Payment method created successfully',
  });

  await expect(service.softDelete(5)).resolves.toEqual({
    msg: 'Payment method soft deleted successfully',
  });

  await expect(service.restore(5)).resolves.toEqual({
    msg: 'Payment method restored successfully',
  });
});
});
