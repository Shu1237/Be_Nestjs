
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

describe('ScheduleSeatService', () => {
  let service: ScheduleSeatService;
  let mockScheduleSeatRepo: Partial<
    Record<keyof Repository<ScheduleSeat>, jest.Mock>
  >;

  beforeEach(async () => {
    mockScheduleSeatRepo = {
      find: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleSeatService,
        {
          provide: getRepositoryToken(ScheduleSeat),
          useValue: mockScheduleSeatRepo,
        },
      ],
    }).compile();

    service = module.get<ScheduleSeatService>(ScheduleSeatService);
  });

  describe('1.findSeatByScheduleId', () => {
    it('✅ 1.1 should return schedule seats for valid schedule ID', async () => {
      const mockScheduleSeats = [
        {
          id: 1,
          schedule: {
            id: 1,
            movie: { name: 'Movie 1' },
            cinemaRoom: { cinema_room_name: 'Room 1' },
          },
          seat: {
            id: 'R1_A1',
            seatType: { seat_type_name: 'VIP' },
          },
          status: StatusSeat.NOT_YET,
        },
      ];

      (mockScheduleSeatRepo.find as jest.Mock).mockResolvedValue(
        mockScheduleSeats,
      );

      const result = await service.findSeatByScheduleId(1);

      expect(result).toEqual(mockScheduleSeats);
      expect(mockScheduleSeatRepo.find).toHaveBeenCalledWith({
        where: { schedule: { id: 1 } },
        relations: ['schedule', 'seat', 'seat.seatType'],
      });
    });

    it('❌ 1.2 should throw NotFoundException when no seats found', async () => {
      (mockScheduleSeatRepo.find as jest.Mock).mockResolvedValue([]);

      await expect(service.findSeatByScheduleId(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('❌ 1.3 should handle database error', async () => {
      (mockScheduleSeatRepo.find as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findSeatByScheduleId(1)).rejects.toThrow(
        'Database error',
      );
    });

    it('✅ 1.4 should return seats with different statuses', async () => {
      const mockScheduleSeats = [
        { id: 1, status: StatusSeat.NOT_YET },
        { id: 2, status: StatusSeat.BOOKED },
        { id: 3, status: StatusSeat.HELD },
      ];

      (mockScheduleSeatRepo.find as jest.Mock).mockResolvedValue(
        mockScheduleSeats,
      );

      const result = await service.findSeatByScheduleId(1);

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe(StatusSeat.NOT_YET);
      expect(result[1].status).toBe(StatusSeat.BOOKED);
      expect(result[2].status).toBe(StatusSeat.HELD);
    });

    it('✅ 1.5 should include schedule and seat relations', async () => {
      const mockScheduleSeats = [
        {
          id: 1,
          schedule: { id: 1, movie: { name: 'Movie 1' } },
          seat: { id: 'R1_A1', seatType: { seat_type_name: 'VIP' } },
        },
      ];

      (mockScheduleSeatRepo.find as jest.Mock).mockResolvedValue(
        mockScheduleSeats,
      );

      const result = await service.findSeatByScheduleId(1);

      expect(result[0].schedule.movie.name).toBe('Movie 1');
      expect(result[0].seat.seatType.seat_type_name).toBe('VIP');
    });
  });

  describe('2.deleteUnbookedSeatsBySchedule', () => {
    it('✅ 2.1 should delete unbooked seats successfully', async () => {
      const mockDeleteResult = { affected: 5 };
      (mockScheduleSeatRepo.delete as jest.Mock).mockResolvedValue(
        mockDeleteResult,
      );

      const result = await service.deleteUnbookedSeatsBySchedule(1);

      expect(result).toBe(5);
      expect(mockScheduleSeatRepo.delete).toHaveBeenCalledWith({
        schedule: { id: 1 },
        status: expect.any(Object), // TypeORM uses FindOperator for In queries
      });
    });

    it('✅ 2.2 should return 0 when no seats to delete', async () => {
      const mockDeleteResult = { affected: 0 };
      (mockScheduleSeatRepo.delete as jest.Mock).mockResolvedValue(
        mockDeleteResult,
      );

      const result = await service.deleteUnbookedSeatsBySchedule(1);

      expect(result).toBe(0);
    });

    it('❌ 2.3 should handle database error during deletion', async () => {
      (mockScheduleSeatRepo.delete as jest.Mock).mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(service.deleteUnbookedSeatsBySchedule(1)).rejects.toThrow(
        'Delete failed',
      );
    });

    it('✅ 2.4 should handle null affected result', async () => {
      const mockDeleteResult = { affected: null };
      (mockScheduleSeatRepo.delete as jest.Mock).mockResolvedValue(
        mockDeleteResult,
      );

      const result = await service.deleteUnbookedSeatsBySchedule(1);

      expect(result).toBe(0);
    
  });
  });
  });

