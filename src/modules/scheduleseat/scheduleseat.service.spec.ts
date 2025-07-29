import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { In, Repository } from 'typeorm';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { StatusSeat } from 'src/common/enums/status_seat.enum';
import { ScheduleSeatService } from './scheduleseat.service';

describe('ScheduleSeatService', () => {
  let service: ScheduleSeatService;
  let mockRepo: Partial<Repository<ScheduleSeat>>;

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleSeatService,
        {
          provide: getRepositoryToken(ScheduleSeat),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ScheduleSeatService>(ScheduleSeatService);
  });

  // ==================== TEST findSeatByScheduleId ====================
  describe('findSeatByScheduleId', () => {
    it('✅ should return schedule seats if found', async () => {
      const mockSeats = [
        {
          id: 1,
          schedule: { id: 10 },
          seat: { id: 101, seatType: { id: 1, name: 'VIP' } },
        },
      ];

      (mockRepo.find as jest.Mock).mockResolvedValue(mockSeats);

      const result = await service.findSeatByScheduleId(10);
      expect(result).toEqual(mockSeats);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { schedule: { id: 10 } },
        relations: ['schedule', 'seat', 'seat.seatType'],
      });
    });

    it('❌ should throw NotFoundException if no seats found', async () => {
      (mockRepo.find as jest.Mock).mockResolvedValue([]);

      await expect(service.findSeatByScheduleId(99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==================== TEST deleteUnbookedSeatsBySchedule ====================
  describe('deleteUnbookedSeatsBySchedule', () => {
    it('✅ should return number of deleted rows', async () => {
      (mockRepo.delete as jest.Mock).mockResolvedValue({ affected: 5 });

      const result = await service.deleteUnbookedSeatsBySchedule(10);
      expect(result).toBe(5);
      expect(mockRepo.delete).toHaveBeenCalledWith({
        schedule: { id: 10 },
        status: expect.anything(), // covered by 'In' clause
      });
    });

    it('✅ should return 0 if no rows affected', async () => {
      (mockRepo.delete as jest.Mock).mockResolvedValue({ affected: 0 });

      const result = await service.deleteUnbookedSeatsBySchedule(10);
      expect(result).toBe(0);
    });
    it('❌ should throw NotFoundException if result is null', async () => {
      (mockRepo.find as jest.Mock).mockResolvedValue(null);
    
      await expect(service.findSeatByScheduleId(123)).rejects.toThrow(NotFoundException);
    });
    it('✅ should return 0 if delete result has no affected property', async () => {
      (mockRepo.delete as jest.Mock).mockResolvedValue({});
    
      const result = await service.deleteUnbookedSeatsBySchedule(99);
      expect(result).toBe(0);
    });
    it('✅ should delete seats with NOT_YET and HELD status only', async () => {
      (mockRepo.delete as jest.Mock).mockResolvedValue({ affected: 2 });
    
      await service.deleteUnbookedSeatsBySchedule(15);
    
      const [deleteArg] = (mockRepo.delete as jest.Mock).mock.calls[0];
      expect(deleteArg.status._value).toEqual([StatusSeat.NOT_YET, StatusSeat.HELD]);
    });
    it('❌ should throw error if repository.find throws', async () => {
      (mockRepo.find as jest.Mock).mockRejectedValue(new Error('DB error'));
    
      await expect(service.findSeatByScheduleId(10)).rejects.toThrow('DB error');
    });
    it('❌ should throw error if repository.delete throws', async () => {
      (mockRepo.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'));
    
      await expect(service.deleteUnbookedSeatsBySchedule(5)).rejects.toThrow('Delete failed');
    });
   
    it('✅ should call find with different schedule IDs', async () => {
      (mockRepo.find as jest.Mock).mockResolvedValue([{ id: 1 }]);
    
      await service.findSeatByScheduleId(10);
      await service.findSeatByScheduleId(11);
    
      expect(mockRepo.find).toHaveBeenCalledTimes(2);
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { schedule: { id: 10 } } }));
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { schedule: { id: 11 } } }));
    });
    it('✅ should return 0 if no unbooked seats found to delete', async () => {
      (mockRepo.delete as jest.Mock).mockResolvedValue({ affected: 0 });
    
      const result = await service.deleteUnbookedSeatsBySchedule(15);
    
      expect(result).toBe(0);
      expect(mockRepo.delete).toHaveBeenCalledWith({
        schedule: { id: 15 },
        status: In([StatusSeat.NOT_YET, StatusSeat.HELD]),
      });
    });
    it('✅ should call find with correct relations', async () => {
      (mockRepo.find as jest.Mock).mockResolvedValue([{ id: 1 }]);
    
      await service.findSeatByScheduleId(100);
    
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: {
          schedule: {
            id: 100,
          },
        },
        relations: ['schedule', 'seat', 'seat.seatType'],
      });
    });
    it('❌ should throw NotFoundException with correct message', async () => {
      (mockRepo.find as jest.Mock).mockResolvedValue([]);
    
      await expect(service.findSeatByScheduleId(77)).rejects.toThrowError(
        new NotFoundException('No seats found for schedule with ID 77'),
      );
    });

    it('❌ should throw error if repository.delete throws', async () => {
      const error = new Error('DB error');
      (mockRepo.delete as jest.Mock).mockRejectedValue(error);
    
      await expect(service.deleteUnbookedSeatsBySchedule(7)).rejects.toThrow('DB error');
      expect(mockRepo.delete).toHaveBeenCalledWith({
        schedule: { id: 7 },
        status: In([StatusSeat.NOT_YET, StatusSeat.HELD]),
      });
    });
    it('❌ should throw error if repository.find throws', async () => {
      const error = new Error('DB error on find');
      (mockRepo.find as jest.Mock).mockRejectedValue(error);
    
      await expect(service.findSeatByScheduleId(10)).rejects.toThrow('DB error on find');
    });
    it('❌ should throw NotFoundException if result is null', async () => {
      (mockRepo.find as jest.Mock).mockResolvedValue(null);
    
      await expect(service.findSeatByScheduleId(200)).rejects.toThrowError(
        new NotFoundException('No seats found for schedule with ID 200'),
      );
    });
    it('✅ should return affected count when many seats deleted', async () => {
      (mockRepo.delete as jest.Mock).mockResolvedValue({ affected: 20 });
    
      const result = await service.deleteUnbookedSeatsBySchedule(99);
    
      expect(result).toBe(20);
    });
    it('✅ should return 0 if affected is undefined', async () => {
      (mockRepo.delete as jest.Mock).mockResolvedValue({});
    
      const result = await service.deleteUnbookedSeatsBySchedule(77);
    
      expect(result).toBe(0);
    });
                    
              
  });

});
