import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeatTypeService } from './seat-type.service';
import { SeatType } from 'src/database/entities/cinema/seat-type';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { Repository } from 'typeorm';

describe('SeatTypeService', () => {
  let service: SeatTypeService;
  let mockRepo: Partial<Record<keyof Repository<SeatType>, jest.Mock>>;

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeatTypeService,
        { provide: getRepositoryToken(SeatType), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<SeatTypeService>(SeatTypeService);
  });

  describe('1.getSeatTypeById', () => {
    it(' ✅ 1.1 should return seat type if found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue({
        id: 2,
        seat_type_name: 'VIP',
      });
      const result = await service.getSeatTypeById('2');
      expect(result).toEqual({ id: 2, seat_type_name: 'VIP' });
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
    });

    it(' ❌ 1.2 should throw NotFoundException if not found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.getSeatTypeById('5')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('2.createSeatType', () => {
    it(' ✅ 2.1 should create a seat type', async () => {
      const dto = {
        seat_type_name: 'VIP',
        seat_type_price: 150000,
        seat_type_description: 'Ghế VIP với không gian rộng rãi',
        cinema_room_id: '2',
      };
      (mockRepo.create as jest.Mock).mockReturnValue(dto);
      (mockRepo.save as jest.Mock).mockResolvedValue(dto);
      const result = await service.createSeatType(dto as any);
      expect(result).toEqual({ msg: 'Seat type created successfully' });
      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalledWith(dto);
    });
  });

  describe('2.updateSeatType', () => {
    it(' ✅ 2.1 should update a seat type', async () => {
      const old = {
        id: 2,
        seat_type_name: 'Normal',
        seat_type_price: 100000,
        seat_type_description: 'Bình thường',
        cinema_room_id: '2',
      };
      const updateDto = {
        seat_type_name: 'VIP',
        seat_type_price: 200000,
        seat_type_description: 'Ghế VIP',
      };
      service.getSeatTypeById = jest.fn().mockResolvedValue(old);
      (mockRepo.save as jest.Mock).mockResolvedValue({ ...old, ...updateDto });
      const result = await service.updateSeatType('2', updateDto as any);
      expect(result).toEqual({ msg: 'Seat type updated successfully' });
      expect(mockRepo.save).toHaveBeenCalledWith({ ...old, ...updateDto });
    });
  });

  describe('2.deleteSeatType', () => {
    it(' ✅ 2.1 should delete a seat type', async () => {
      const seatType = { id: 2, seat_type_name: 'VIP' };
      service.getSeatTypeById = jest.fn().mockResolvedValue(seatType);
      (mockRepo.remove as jest.Mock).mockResolvedValue(seatType);
      const result = await service.deleteSeatType('2');
      expect(result).toEqual({ msg: 'Seat type deleted successfully' });
      expect(mockRepo.remove).toHaveBeenCalledWith(seatType);
    });
  });

  describe('0.getAllSeatTypes', () => {
    it(' ✅ 0.1 should return all seat types', async () => {
      const seatTypes = [
        { id: 1, seat_type_name: 'Normal' },
        { id: 2, seat_type_name: 'VIP' },
      ];
      (mockRepo.find as jest.Mock).mockResolvedValue(seatTypes);
      const result = await service.getAllSeatTypes();
      expect(result).toEqual(seatTypes);
      expect(mockRepo.find).toHaveBeenCalled();
    });
    it('✅ 1.3 should throw NotFoundException when ID is negative', async () => {
      await expect(service.getSeatTypeById("-1")).rejects.toThrow(NotFoundException);
    });
    
  });

  describe('2.updateSeatType (negative case)', () => {
    it(' ❌ 2.2 should throw NotFoundException when updating a non-existent seat type', async () => {
      service.getSeatTypeById = jest.fn().mockRejectedValue(new NotFoundException('Seat type with ID 99 not found'));
      await expect(
        service.updateSeatType('99', { seat_type_name: 'Premium' } as any),
      ).rejects.toThrow(NotFoundException);
    });
    // it('✅ 2.3 should trim name and create successfully', async () => {
    //   (mockRepo.findOne as jest.Mock).mockResolvedValue(null);
    //   (mockRepo.create as jest.Mock).mockImplementation(dto => dto);
    //   (mockRepo.save as jest.Mock).mockResolvedValue({ id: 2, seat_type_name: 'Normal' });
    
    //   const dto = { seat_type_name: ' Normal ' };
    //   const result = await service.createSeatType(dto);
    //   expect(result.msg).toBe('  Normal ');
    // });
    
  });

  describe('3.deleteSeatType (negative case)', () => {
    it(' ❌ 3.2 should throw NotFoundException when deleting a non-existent seat type', async () => {
      service.getSeatTypeById = jest.fn().mockRejectedValue(new NotFoundException('Seat type with ID 99 not found'));
      await expect(service.deleteSeatType('99')).rejects.toThrow(NotFoundException);
    });
    it('❌ 3.3 should throw NotFoundException if seat type not found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.updateSeatType("1", { seat_type_name: 'Updated' }))
        .rejects.toThrow(NotFoundException);
    });
    
  });
  describe('3.getAllSeatTypes', () => {
    it(' ✅ 3.1 should return all seat types', async () => {
      const seatTypes = [
        { id: 1, seat_type_name: 'Normal' },
        { id: 2, seat_type_name: 'VIP' },
      ];
      (mockRepo.find as jest.Mock).mockResolvedValue(seatTypes);

      const result = await service.getAllSeatTypes();
      expect(result).toEqual(seatTypes);
      expect(mockRepo.find).toHaveBeenCalled();
    });
    
it('✅ 5.2 should return empty array if no seat types exist', async () => {
  (mockRepo.find as jest.Mock).mockResolvedValue([]);
  const result = await service.getAllSeatTypes();
  expect(result).toEqual([]);
});
});



});
