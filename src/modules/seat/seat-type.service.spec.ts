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

  describe('getSeatTypeById', () => {
    it('should return seat type if found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue({ id: 2, seat_type_name: 'VIP' });
      const result = await service.getSeatTypeById('2');
      expect(result).toEqual({ id: 2, seat_type_name: 'VIP' });
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
    });

    it('should throw NotFoundException if not found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.getSeatTypeById('5')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createSeatType', () => {
    it('should create a seat type', async () => {
      const dto = {
        seat_type_name: 'VIP',
        seat_type_price: 150000,
        seat_type_description: 'Ghế VIP với không gian rộng rãi',
        cinema_room_id: '2'
      };
      (mockRepo.create as jest.Mock).mockReturnValue(dto);
      (mockRepo.save as jest.Mock).mockResolvedValue(dto);
      const result = await service.createSeatType(dto as any);
      expect(result).toEqual({ msg: 'Seat type created successfully' });
      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateSeatType', () => {
    it('should update a seat type', async () => {
      const old = {
        id: 2,
        seat_type_name: 'Normal',
        seat_type_price: 100000,
        seat_type_description: 'Bình thường',
        cinema_room_id: '2'
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

  describe('deleteSeatType', () => {
    it('should delete a seat type', async () => {
      const seatType = { id: 2, seat_type_name: 'VIP' };
      service.getSeatTypeById = jest.fn().mockResolvedValue(seatType);
      (mockRepo.remove as jest.Mock).mockResolvedValue(seatType);
      const result = await service.deleteSeatType('2');
      expect(result).toEqual({ msg: 'Seat type deleted successfully' });
      expect(mockRepo.remove).toHaveBeenCalledWith(seatType);
    });
  });
});