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
        getRawOne: jest.fn().mockResolvedValue({ activeCount: '0', deletedCount: '0' }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CinemaRoomService,
        { provide: getRepositoryToken(CinemaRoom), useValue: mockCinemaRoomRepo },
      ],
    }).compile();

    service = module.get<CinemaRoomService>(CinemaRoomService);
  });

  describe('1.create', () => {
    it('✅ 1.1 should create a cinema room successfully', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockCinemaRoomRepo.create as jest.Mock).mockReturnValue({ id: 1, cinema_room_name: 'A' });
      (mockCinemaRoomRepo.save as jest.Mock).mockResolvedValue({ id: 1, cinema_room_name: 'A' });
      const result = await service.create({ cinema_room_name: 'A' });
      expect(result).toEqual({ message: 'Cinema room created successfully' });
    });

    it('❌ 1.2 should throw BadRequestException if cinema room name exists', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, cinema_room_name: 'A' });
      await expect(service.create({ cinema_room_name: 'A' })).rejects.toThrow(BadRequestException);
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
  });

  describe('3.update', () => {
    it('✅ 3.1 should update a cinema room successfully', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(undefined) // Name doesn't exist
        .mockResolvedValueOnce({ id: 1, cinema_room_name: 'B' }); // findOne in findOne()
      (mockCinemaRoomRepo.save as jest.Mock).mockResolvedValue({ id: 1, cinema_room_name: 'B' });
      const result = await service.update(1, { cinema_room_name: 'B' });
      expect(result).toEqual({ message: 'Cinema room updated successfully' });
    });

    it('❌ 3.2 should throw BadRequestException if cinema room name exists', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue({ id: 2, cinema_room_name: 'B' });
      await expect(service.update(1, { cinema_room_name: 'B' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('4.remove', () => {
    it('✅ 4.1 should delete a cinema room successfully', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockCinemaRoomRepo.remove as jest.Mock).mockResolvedValue({});
      const result = await service.remove(1);
      expect(result).toEqual({ msg: 'Cinema Room deleted successfully' });
    });
  });

  describe('5.softDeleteCinemaRoom', () => {
    it('✅ 5.1 should soft delete a cinema room', async () => {
      const cinemaRoom = { id: 1, is_deleted: false };
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue(cinemaRoom);
      (mockCinemaRoomRepo.save as jest.Mock).mockResolvedValue({ ...cinemaRoom, is_deleted: true });
      const result = await service.softDeleteCinemaRoom(1);
      expect(result).toEqual({ msg: 'Cinema Room soft-deleted successfully', cinemaRoom });
    });
    it('❌ 5.2 should throw NotFoundException if not found', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.softDeleteCinemaRoom(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('6.restoreCinemaRoom', () => {
    it('✅ 6.1 should restore a soft-deleted cinema room', async () => {
      const cinemaRoom = { id: 1, is_deleted: true };
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue(cinemaRoom);
      (mockCinemaRoomRepo.save as jest.Mock).mockResolvedValue({ ...cinemaRoom, is_deleted: false });
      const result = await service.restoreCinemaRoom(1);
      expect(result).toEqual({ msg: 'Cinema Room restored successfully', cinemaRoom });
    });
    it('❌ 6.2 should throw NotFoundException if not found', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.restoreCinemaRoom(1)).rejects.toThrow(NotFoundException);
    });
    it('❌ 6.3 should throw BadRequestException if not soft-deleted', async () => {
      (mockCinemaRoomRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, is_deleted: false });
      await expect(service.restoreCinemaRoom(1)).rejects.toThrow(BadRequestException);
    });
  });
});