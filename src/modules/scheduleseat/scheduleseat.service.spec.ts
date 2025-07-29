import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScheduleSeatService } from './scheduleseat.service';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { Repository } from 'typeorm';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { StatusSeat } from 'src/common/enums/status_seat.enum';

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
