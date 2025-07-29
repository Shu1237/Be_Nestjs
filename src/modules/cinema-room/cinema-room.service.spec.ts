import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CinemaRoomService } from './cinema-room.service';
import { CinemaRoom } from '../../database/entities/cinema/cinema-room';
import { Repository } from 'typeorm';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';

describe('CinemaRoomService', () => {
  let service: CinemaRoomService;
  let mockCinemaRoomRepo: Partial<Repository<CinemaRoom>>;

  beforeEach(async () => {
    mockCinemaRoomRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        getRawOne: jest
          .fn()
          .mockResolvedValue({ activeCount: '0', deletedCount: '0' }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CinemaRoomService,
        {
          provide: getRepositoryToken(CinemaRoom),
          useValue: mockCinemaRoomRepo,
        },
      ],
    }).compile();

    service = module.get<CinemaRoomService>(CinemaRoomService);
  });

  describe('1.create', () => {
    it('✅ 1.1 should create a cinema room successfully', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockCinemaRoomRepo.create as jest.Mock).mockReturnValue({
        id: 1,
        cinema_room_name: 'A',
      });
      (mockCinemaRoomRepo.save as jest.Mock).mockResolvedValue({
        id: 1,
        cinema_room_name: 'A',
      });
      const result = await service.create({ cinema_room_name: 'A' });
      expect(result).toEqual({ message: 'Cinema room created successfully' });
    });

    it('❌ 1.2 should throw BadRequestException if cinema room name exists', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        cinema_room_name: 'A',
      });
      await expect(service.create({ cinema_room_name: 'A' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('1.1.create edge cases', () => {
    it('❌ 1.1.1 should throw if createCinemaRoomDto is null', async () => {
      await expect(service.create(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ 1.1.4 should throw if save throws error', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockCinemaRoomRepo.create as jest.Mock).mockReturnValue({
        cinema_room_name: 'A',
      });
      (mockCinemaRoomRepo.save as jest.Mock).mockRejectedValue(
        new Error('Save error'),
      );
      await expect(
        service.create({ cinema_room_name: 'A' } as any),
      ).rejects.toThrow('Save error');
    });
    it('❌ 1.1.5 should trim cinema_room_name and detect duplicate', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        cinema_room_name: 'A',
      });
      await expect(service.create({ cinema_room_name: ' A ' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('1.2.findAll', () => {
    it('✅ 1.2.1 should return paginated cinema rooms', async () => {
      (mockCinemaRoomRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
        getRawOne: jest
          .fn()
          .mockResolvedValue({ activeCount: '1', deletedCount: '0' }),
      });
      const filters = {
        page: 1,
        take: 10,
        sortBy: 'cinema_room_name',
        sortOrder: 'ASC',
      } as any;
      const result = await service.findAll(filters);
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });
    it('❌ 1.2.2 should handle page/take = 0', async () => {
      const filters = { page: 0, take: 0 } as any;
      await expect(service.findAll(filters)).resolves.toBeDefined();
    });
    it('❌ 1.2.3 should handle negative page/take', async () => {
      const filters = { page: -1, take: -5 } as any;
      await expect(service.findAll(filters)).resolves.toBeDefined();
    });
    it('❌ 1.2.4 should handle missing filters', async () => {
      await expect(service.findAll(undefined as any)).rejects.toThrow(
        BadRequestException,
      );
    });
    it('✅ 1.2.5 should apply default pagination if page/take are missing', async () => {
      (mockCinemaRoomRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
        getRawOne: jest
          .fn()
          .mockResolvedValue({ activeCount: '1', deletedCount: '0' }),
      });

      const result = await service.findAll({} as any);
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });
    it('✅ 1.2.6 should sort by allowed field', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
        getRawOne: jest
          .fn()
          .mockResolvedValue({ activeCount: '1', deletedCount: '0' }),
      };
      (mockCinemaRoomRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      await service.findAll({
        page: 1,
        take: 10,
        sortBy: 'cinema_room_name',
        sortOrder: 'ASC',
      } as any);
      expect(qb.orderBy).toHaveBeenCalled();
    });

    it('❌ 1.2.7 should use default sort when sortBy is invalid', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        getRawOne: jest
          .fn()
          .mockResolvedValue({ activeCount: '0', deletedCount: '0' }),
      };
      (mockCinemaRoomRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      await service.findAll({
        page: 1,
        take: 10,
        sortBy: 'invalidField',
        sortOrder: 'DESC',
      } as any);
      expect(qb.orderBy).toHaveBeenCalled();
    });
  });

  describe('2.findOne', () => {
    it('✅ 2.1 should return the cinema room if found', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      expect(await service.findOne(1)).toEqual({ id: 1 });
    });
    it('❌ 2.2 should throw NotFoundException if not found', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
    it('❌ 2.4 should throw if id is null', async () => {
      await expect(service.findOne(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ 2.5 should throw if id is not a number', async () => {
      await expect(service.findOne('abc' as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('3.update', () => {
    it('✅ 3.1 should update a cinema room successfully', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(undefined) // Name doesn't exist
        .mockResolvedValueOnce({ id: 1, cinema_room_name: 'B' }); // findOne in findOne()
      (mockCinemaRoomRepo.save as jest.Mock).mockResolvedValue({
        id: 1,
        cinema_room_name: 'B',
      });
      const result = await service.update(1, { cinema_room_name: 'B' });
      expect(result).toEqual({ message: 'Cinema room updated successfully' });
    });

    it('❌ 3.2 should throw BadRequestException if cinema room name exists', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue({
        id: 2,
        cinema_room_name: 'B',
      });
      await expect(
        service.update(1, { cinema_room_name: 'B' }),
      ).rejects.toThrow(BadRequestException);
    });
    it('❌ 3.3 should throw if update value is same as existing name but different ID', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue({
        id: 2,
        cinema_room_name: 'B',
      }); // another room
      await expect(
        service.update(1, { cinema_room_name: 'B' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('❌ 3.4 should throw if updateCinemaRoomDto is undefined', async () => {
      await expect(service.update(1, undefined as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('4.remove', () => {
    it('✅ 4.1 should delete a cinema room successfully', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockCinemaRoomRepo.remove as jest.Mock).mockResolvedValue({});
      const result = await service.remove(1);
      expect(result).toEqual({ msg: 'Cinema Room deleted successfully' });
    });
    it('❌ 4.3 should throw error if remove fails', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockCinemaRoomRepo.remove as jest.Mock).mockRejectedValue(
        new Error('Remove failed'),
      );

      await expect(service.remove(1)).rejects.toThrow('Remove failed');
    });
    it('❌ 4.4 should throw if remove fails due to DB error', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockCinemaRoomRepo.remove as jest.Mock).mockRejectedValue(
        new Error('SQL error'),
      );
      await expect(service.remove(1)).rejects.toThrow('SQL error');
    });
  });

  describe('5.softDeleteCinemaRoom', () => {
    it('✅ 5.1 should soft delete a cinema room', async () => {
      const cinemaRoom = { id: 1, is_deleted: false };
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue(cinemaRoom);
      (mockCinemaRoomRepo.save as jest.Mock).mockResolvedValue({
        ...cinemaRoom,
        is_deleted: true,
      });
      const result = await service.softDeleteCinemaRoom(1);
      expect(result).toEqual({
        msg: 'Cinema Room soft-deleted successfully',
        cinemaRoom,
      });
    });
    it('❌ 5.2 should throw NotFoundException if not found', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.softDeleteCinemaRoom(1)).rejects.toThrow(
        NotFoundException,
      );
    });
    it('✅ 5.3 should still proceed if already soft-deleted (idempotent)', async () => {
      const cinemaRoom = { id: 1, is_deleted: true };
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue(cinemaRoom);
      (mockCinemaRoomRepo.save as jest.Mock).mockResolvedValue(cinemaRoom);

      const result = await service.softDeleteCinemaRoom(1);
      expect(result.cinemaRoom.is_deleted).toBe(true);
    });
    it('✅ 5.4 should allow soft delete even if already soft-deleted', async () => {
      const room = { id: 1, is_deleted: true };
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue(room);
      (mockCinemaRoomRepo.save as jest.Mock).mockResolvedValue(room);
      const result = await service.softDeleteCinemaRoom(1);
      expect(result.cinemaRoom.is_deleted).toBe(true);
    });
  });

  describe('6.restoreCinemaRoom', () => {
    it('✅ 6.1 should restore a soft-deleted cinema room', async () => {
      const cinemaRoom = { id: 1, is_deleted: true };
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue(cinemaRoom);
      (mockCinemaRoomRepo.save as jest.Mock).mockResolvedValue({
        ...cinemaRoom,
        is_deleted: false,
      });
      const result = await service.restoreCinemaRoom(1);
      expect(result).toEqual({
        msg: 'Cinema Room restored successfully',
        cinemaRoom,
      });
    });
    it('❌ 6.2 should throw NotFoundException if not found', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.restoreCinemaRoom(1)).rejects.toThrow(
        NotFoundException,
      );
    });
    it('❌ 6.3 should throw BadRequestException if not soft-deleted', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        is_deleted: false,
      });
      await expect(service.restoreCinemaRoom(1)).rejects.toThrow(
        BadRequestException,
      );
    });
    it('❌ 6.5 should throw if restoreCinemaRoom is called with NaN id', async () => {
      await expect(service.restoreCinemaRoom(NaN)).rejects.toThrow(
        BadRequestException,
      );
    });
    it('❌ 6.6 should throw if id is undefined', async () => {
      await expect(service.restoreCinemaRoom(undefined as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ 6.7 should throw if repository.save is null', async () => {
      const room = { id: 1, is_deleted: true };
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue(room);
      (mockCinemaRoomRepo.save as jest.Mock).mockResolvedValue(null);
      const result = await service.restoreCinemaRoom(1);
      expect(result).toEqual({
        msg: 'Cinema Room restored successfully',
        cinemaRoom: room,
      });
    });
  });

  it('✅ 7.1 should return all cinema rooms where is_deleted is false', async () => {
    const mockRooms = [
      { id: 1, cinema_room_name: 'A', is_deleted: false },
      { id: 2, cinema_room_name: 'B', is_deleted: false },
    ];
    (mockCinemaRoomRepo.find as jest.Mock).mockResolvedValue(mockRooms);

    const result = await service.getAllCinemaRoomsUser();
    expect(result).toEqual(mockRooms);
    expect(mockCinemaRoomRepo.find).toHaveBeenCalledWith({
      where: { is_deleted: false },
    });
  });

  it('❌ 7.2 should return empty array if no active cinema rooms', async () => {
    (mockCinemaRoomRepo.find as jest.Mock).mockResolvedValue([]);

    const result = await service.getAllCinemaRoomsUser();
    expect(result).toEqual([]);
  });

  it('❌ 7.3 should throw error if repository fails', async () => {
    (mockCinemaRoomRepo.find as jest.Mock).mockRejectedValue(
      new Error('DB error'),
    );

    await expect(service.getAllCinemaRoomsUser()).rejects.toThrow('DB error');
  });
  it('✅ 7.4 should call repository.find each time getAllCinemaRoomsUser is called', async () => {
    (mockCinemaRoomRepo.find as jest.Mock).mockResolvedValue([]);
    await service.getAllCinemaRoomsUser();
    await service.getAllCinemaRoomsUser();
    expect(mockCinemaRoomRepo.find).toHaveBeenCalledTimes(2);
  });
  it('✅ 7.5 should return empty array if no rooms found', async () => {
    (mockCinemaRoomRepo.find as jest.Mock).mockResolvedValue([]);
    const result = await service.getAllCinemaRoomsUser();
    expect(result).toEqual([]);
  });

  it('❌ 7.6 should throw if find throws unexpected error', async () => {
    (mockCinemaRoomRepo.find as jest.Mock).mockRejectedValue(
      new Error('Unexpected'),
    );
    await expect(service.getAllCinemaRoomsUser()).rejects.toThrow('Unexpected');
  });
});
