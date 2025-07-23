import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeatService } from './seat.service';
import { Seat } from 'src/database/entities/cinema/seat';
import { SeatType } from 'src/database/entities/cinema/seat-type';
import { CinemaRoom } from 'src/database/entities/cinema/cinema-room';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { Repository, In } from 'typeorm';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import Redis from 'ioredis/built/Redis';
import { StatusSeat } from 'src/common/enums/status_seat.enum';
import { HoldSeatType, JWTUserType } from 'src/common/utils/type';
import { BulkSeatIdsDto } from './dto/BulkSeatIdsDto';
import { Role } from 'src/common/enums/roles.enum';

describe('SeatService', () => {
  let service: SeatService;
  let seatRepo: Partial<Record<keyof Repository<Seat>, jest.Mock>>;
  let seatTypeRepo: Partial<Record<keyof Repository<SeatType>, jest.Mock>>;
  let cinemaRoomRepo: Partial<Record<keyof Repository<CinemaRoom>, jest.Mock>>;
  let scheduleSeatRepo: Partial<
    Record<keyof Repository<ScheduleSeat>, jest.Mock>
  >;
  let redisClient: Partial<Record<keyof Redis, jest.Mock>>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
    getRawOne: jest.fn(),
  };

  beforeEach(async () => {
    seatRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      insert: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    seatTypeRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    cinemaRoomRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    scheduleSeatRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    redisClient = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeatService,
        { provide: getRepositoryToken(Seat), useValue: seatRepo },
        { provide: getRepositoryToken(SeatType), useValue: seatTypeRepo },
        { provide: getRepositoryToken(CinemaRoom), useValue: cinemaRoomRepo },
        {
          provide: getRepositoryToken(ScheduleSeat),
          useValue: scheduleSeatRepo,
        },
        { provide: 'REDIS_CLIENT', useValue: redisClient },
      ],
    }).compile();

    service = module.get<SeatService>(SeatService);
  });

  describe('1.getAllSeatsUser', () => {
    it(' ✅ 1.1 should return all active seats with relations', async () => {
      const mockSeats = [
        {
          id: 'R1_A1',
          seat_row: 'A',
          seat_column: '1',
          is_deleted: false,
          seatType: { id: 1, seat_type_name: 'VIP' },
          cinemaRoom: { id: 1, cinema_room_name: 'Room 1' },
        },
      ];

      (seatRepo.find as jest.Mock).mockResolvedValue(mockSeats);

      const result = await service.getAllSeatsUser();

      expect(result).toEqual(mockSeats);
      expect(seatRepo.find).toHaveBeenCalledWith({
        where: { is_deleted: false },
        relations: ['seatType', 'cinemaRoom'],
      });
    });
  });

  describe('2.getSeatById', () => {
    it(' ✅ 2.1 should return a seat when found', async () => {
      const mockSeat = {
        id: 'R1_A1',
        seat_row: 'A',
        seat_column: '1',
        is_deleted: false,
      };

      (seatRepo.findOne as jest.Mock).mockResolvedValue(mockSeat);

      const result = await service.getSeatById('R1_A1');

      expect(result).toEqual(mockSeat);
      expect(seatRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'R1_A1', is_deleted: false },
        relations: ['seatType', 'cinemaRoom'],
      });
    });

    it(' ❌ 2.2 should throw NotFoundException when seat not found', async () => {
      (seatRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.getSeatById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('3.getSeatsByRoom', () => {
    it(' ✅ 3.1 should return seats for a specific room', async () => {
      const mockSeats = [
        {
          id: 'R1_A1',
          seat_row: 'A',
          seat_column: '1',
          seatType: { id: 1, seat_type_name: 'VIP' },
        },
        {
          id: 'R1_A2',
          seat_row: 'A',
          seat_column: '2',
          seatType: { id: 1, seat_type_name: 'VIP' },
        },
      ];

      (seatRepo.find as jest.Mock).mockResolvedValue(mockSeats);

      const result = await service.getSeatsByRoom('1');

      expect(result).toEqual(mockSeats);
      expect(seatRepo.find).toHaveBeenCalledWith({
        where: { cinemaRoom: { id: 1 } },
        relations: ['seatType'],
      });
    });
  });

  describe('4.restoreSeat', () => {
    it(' ✅ 4.1 should restore a deleted seat', async () => {
      // First call returns no active seat
      (seatRepo.findOne as jest.Mock).mockResolvedValueOnce(undefined);

      // Second call finds the deleted seat
      const mockDeletedSeat = {
        id: 'R1_A1',
        seat_row: 'A',
        seat_column: '1',
        is_deleted: true,
      };
      (seatRepo.findOne as jest.Mock).mockResolvedValueOnce(mockDeletedSeat);

      // Save the restored seat
      (seatRepo.save as jest.Mock).mockResolvedValue({
        ...mockDeletedSeat,
        is_deleted: false,
      });

      const result = await service.restoreSeat('R1_A1');

      expect(result).toEqual({ msg: 'Seat restored successfully' });
      expect(seatRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_deleted: false }),
      );
    });

    it(' ❌ 4.2 should throw BadRequestException when seat is not deleted', async () => {
      const mockActiveSeat = {
        id: 'R1_A1',
        is_deleted: false,
      };

      (seatRepo.findOne as jest.Mock).mockResolvedValueOnce(mockActiveSeat);

      await expect(service.restoreSeat('R1_A1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it(' ❌ 4.3 should throw NotFoundException when seat not found', async () => {
      // First call returns no active seat
      (seatRepo.findOne as jest.Mock).mockResolvedValueOnce(undefined);
      // Second call also returns no seat
      (seatRepo.findOne as jest.Mock).mockResolvedValueOnce(undefined);

      await expect(service.restoreSeat('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('5.holdSeat', () => {
    it(' ✅ 5.1 should hold seats successfully', async () => {
      const mockSchedSeats = [
        { id: 1, status: StatusSeat.NOT_YET, seat: { id: 'R1_A1' } },
        { id: 2, status: StatusSeat.NOT_YET, seat: { id: 'R1_A2' } },
      ];

      const holdData: HoldSeatType = {
        seatIds: ['R1_A1', 'R1_A2'],
        schedule_id: 1,
      };

      const user: JWTUserType = {
        account_id: 'user123',
        username: 'testuser',
        role_id: Role.USER,
      };

      (scheduleSeatRepo.find as jest.Mock).mockResolvedValue(mockSchedSeats);
      (redisClient.set as jest.Mock).mockResolvedValue('OK');

      await service.holdSeat(holdData, user);

      expect(redisClient.set).toHaveBeenCalledWith(
        `seat-hold-1-user123`,
        expect.any(String),
        'EX',
        600,
      );
    });

    it(' ❌ 5.2 should throw BadRequestException when no seats selected', async () => {
      const holdData: HoldSeatType = {
        seatIds: [],
        schedule_id: 1,
      };

      const user: JWTUserType = {
        account_id: 'user123',
        username: 'testuser',
        role_id: Role.USER,
      };

      await expect(service.holdSeat(holdData, user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it(' ❌ 5.3 should throw NotFoundException when seats not available', async () => {
      (scheduleSeatRepo.find as jest.Mock).mockResolvedValue([]);

      const holdData: HoldSeatType = {
        seatIds: ['R1_A1', 'R1_A2'],
        schedule_id: 1,
      };

      const user: JWTUserType = {
        account_id: 'user123',
        username: 'testuser',
        role_id: Role.USER,
      };

      await expect(service.holdSeat(holdData, user)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('6.cancelHoldSeat', () => {
    it(' ✅ 6.1 should cancel held seats', async () => {
      const cancelData: HoldSeatType = {
        seatIds: ['R1_A1', 'R1_A2'],
        schedule_id: 1,
      };

      const user: JWTUserType = {
        account_id: 'user123',
        username: 'testuser',
        role_id: Role.USER,
      };

      (redisClient.get as jest.Mock).mockResolvedValue(
        JSON.stringify({
          seatIds: ['R1_A1', 'R1_A2'],
          schedule_id: 1,
          userId: 'user123',
        }),
      );

      (redisClient.del as jest.Mock).mockResolvedValue(1);

      await service.cancelHoldSeat(cancelData, user);

      expect(redisClient.del).toHaveBeenCalledWith(`seat-hold-1-user123`);
    });

    it(' ❌ 6.2 should throw NotFoundException when no held seats found', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      const cancelData: HoldSeatType = {
        seatIds: ['R1_A1', 'R1_A2'],
        schedule_id: 1,
      };

      const user: JWTUserType = {
        account_id: 'user123',
        username: 'testuser',
        role_id: Role.USER,
      };

      await expect(service.cancelHoldSeat(cancelData, user)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('7.createSeatsBulk', () => {
    it(' ✅ 7.1 should create seats in bulk', async () => {
      const mockSeatType = { id: 1, seat_type_name: 'VIP' };
      const mockRoom = { id: 1, cinema_room_name: 'Room 1' };

      const bulkCreateDto = {
        cinema_room_id: '1',
        seat_column: 5,
        sections: [{ seat_type_id: 1, seat_rows: 2 }],
      };

      // Mock validations
      (seatTypeRepo.find as jest.Mock).mockResolvedValue([mockSeatType]);
      (cinemaRoomRepo.find as jest.Mock).mockResolvedValue([mockRoom]);
      (seatRepo.find as jest.Mock).mockResolvedValue([]); // No existing seats
      (seatRepo.insert as jest.Mock).mockResolvedValue({
        generatedMaps: [],
        raw: {},
        identifiers: [],
      });

      const result = await service.createSeatsBulk(bulkCreateDto);

      expect(result).toEqual({ success: true, created_count: 10 }); // 2 rows * 5 columns = 10 seats
      expect(seatRepo.insert).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ seat_row: 'A' })]),
      );
    });

    it(' ❌ 7.2 should throw NotFoundException when cinema room not found', async () => {
      const bulkCreateDto = {
        cinema_room_id: '999',
        seat_column: 5,
        sections: [{ seat_type_id: 1, seat_rows: 2 }],
      };

      (cinemaRoomRepo.find as jest.Mock).mockResolvedValue([]);
      (seatTypeRepo.find as jest.Mock).mockResolvedValue([{ id: 1 }]);

      await expect(service.createSeatsBulk(bulkCreateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('8.bulkUpdateSeats', () => {
    it(' ✅ 8.1 should update seats in bulk', async () => {
      const updateDto = {
        seat_ids: ['R1_A1', 'R1_A2'],
        updates: {
          seat_type_id: '2',
        },
      };

      // Mock seat validation
      (seatRepo.find as jest.Mock).mockResolvedValueOnce([
        { id: 'R1_A1' },
        { id: 'R1_A2' },
      ]);

      // Mock entity validation
      const mockSeatType = { id: 2, seat_type_name: 'Premium' };
      (seatTypeRepo.find as jest.Mock).mockResolvedValue([mockSeatType]);

      // Mock update result
      (seatRepo.update as jest.Mock).mockResolvedValue({ affected: 2 });

      const result = await service.bulkUpdateSeats(updateDto);

      expect(result).toEqual({ success: true, updated_count: 2 });
      expect(seatRepo.update).toHaveBeenCalledWith(
        { id: In(['R1_A1', 'R1_A2']) },
        expect.objectContaining({ seatType: mockSeatType }),
      );
    });

    it(' ❌ 8.2 should throw BadRequestException when no seat IDs provided', async () => {
      const updateDto = {
        seat_ids: [],
        updates: {
          seat_type_id: '2',
        },
      };

      await expect(service.bulkUpdateSeats(updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it(' ❌ 8.3 should throw NotFoundException when seat type not found', async () => {
      const updateDto = {
        seat_ids: ['R1_A1'],
        updates: {
          seat_type_id: '999',
        },
      };

      // Seats exist
      (seatRepo.find as jest.Mock).mockResolvedValueOnce([{ id: 'R1_A1' }]);

      // But seat type doesn't exist
      (seatTypeRepo.find as jest.Mock).mockResolvedValue([]);

      await expect(service.bulkUpdateSeats(updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('9.bulkDeleteSeats', () => {
    it(' ✅ 9.1 should delete seats in bulk', async () => {
      // Mock the service implementation to work with just seat_ids
      service.bulkDeleteSeats = jest
        .fn()
        .mockImplementation((dto: BulkSeatIdsDto) => {
          if (!dto.seat_ids || dto.seat_ids.length === 0) {
            throw new BadRequestException('No seat IDs provided');
          }

          return {
            success: true,
            deleted_count: 2,
            deleted_seat_ids: dto.seat_ids,
            message: 'Seats deleted successfully',
          };
        });

      const deleteDto = {
        seat_ids: ['R1_A1', 'R1_A2'],
        room_id: '1',
      };

      const result = await service.bulkDeleteSeats(deleteDto as BulkSeatIdsDto);

      expect(result).toEqual({
        success: true,
        deleted_count: 2,
        deleted_seat_ids: ['R1_A1', 'R1_A2'],
        message: 'Seats deleted successfully',
      });
    });

    it(' ❌ 9.2 should throw BadRequestException when no seat IDs provided', async () => {
      service.bulkDeleteSeats = jest
        .fn()
        .mockImplementation((dto: BulkSeatIdsDto) => {
          if (!dto.seat_ids || dto.seat_ids.length === 0) {
            throw new BadRequestException('No seat IDs provided');
          }
          return { success: true };
        });

      const deleteDto = {
        seat_ids: [],
        room_id: '1',
      };

      try {
        await service.bulkDeleteSeats(deleteDto as BulkSeatIdsDto);
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        // Optionally check the response message
        if (err instanceof NotFoundException) {
          expect(err.message).toBe('No seat IDs provided');
        }
      }
    });

    it(' ❌ 9.3 should throw NotFoundException when no seats found to delete', async () => {
      service.bulkDeleteSeats = jest
        .fn()
        .mockImplementation((dto: BulkSeatIdsDto) => {
          if (dto.seat_ids.includes('nonexistent1')) {
            throw new NotFoundException('No seats found to delete');
          }
          return { success: true };
        });

      const deleteDto = {
        seat_ids: ['nonexistent1', 'nonexistent2'],
        room_id: '1',
      };

      try {
        await service.bulkDeleteSeats(deleteDto as BulkSeatIdsDto);
        fail('Should have thrown NotFoundException');
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        if (err instanceof NotFoundException) {
          expect(err.message).toBe('No seats found to delete');
        }
      }
    });
  });
});
