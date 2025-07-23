import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScheduleService } from './schedule.service';
import { Schedule } from 'src/database/entities/cinema/schedule';
import { Movie } from 'src/database/entities/cinema/movie';
import { CinemaRoom } from 'src/database/entities/cinema/cinema-room';
import { Version } from 'src/database/entities/cinema/version';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let mockScheduleRepo: any;
  let mockMovieRepo: any;
  let mockCinemaRoomRepo: any;
  let mockVersionRepo: any;

  beforeEach(async () => {
    mockScheduleRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      }),
      softDelete: jest.fn(),
    };
    mockMovieRepo = {
      findOne: jest.fn(),
    };
    mockCinemaRoomRepo = {
      findOne: jest.fn(),
    };
    mockVersionRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: getRepositoryToken(Schedule), useValue: mockScheduleRepo },
        { provide: getRepositoryToken(Movie), useValue: mockMovieRepo },
        { provide: getRepositoryToken(CinemaRoom), useValue: mockCinemaRoomRepo },
        { provide: getRepositoryToken(Version), useValue: mockVersionRepo },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
  });

  describe('1.create', () => {
    const dto = {
      movie_id: 1,
      cinema_room_id: 2,
      id_Version: 3,
      start_movie_time: '2025-06-10 14:00',
      end_movie_time: '2025-06-10 16:00',
    };

    it(' ✅ 1.1 should create a schedule successfully', async () => {
      mockMovieRepo.findOne.mockResolvedValue({
        id: 1,
        versions: [{ id: 3 }],
        name: 'Movie',
      });
      mockCinemaRoomRepo.findOne.mockResolvedValue({ id: 2, cinema_room_name: 'Room A' });
      mockVersionRepo.findOne.mockResolvedValue({ id: 3, name: '2D' });
      mockScheduleRepo.createQueryBuilder().getOne.mockResolvedValue(undefined);
      mockScheduleRepo.create.mockReturnValue({});
      mockScheduleRepo.save.mockResolvedValue({});

      await expect(service.create(dto as any)).resolves.toEqual({
        message: 'create successfully schedule',
      });
    });

    it(' ❌ 1.2 should throw NotFoundException if movie not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue(undefined);
      await expect(service.create(dto as any)).rejects.toThrow(NotFoundException);
    });

    it(' ❌ 1.3 should throw NotFoundException if cinema room not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, versions: [{ id: 3 }] });
      mockCinemaRoomRepo.findOne.mockResolvedValue(undefined);
      await expect(service.create(dto as any)).rejects.toThrow(NotFoundException);
    });

    it(' ❌ 1.4 should throw NotFoundException if version not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, versions: [{ id: 3 }] });
      mockCinemaRoomRepo.findOne.mockResolvedValue({ id: 2, cinema_room_name: 'Room A' });
      mockVersionRepo.findOne.mockResolvedValue(undefined);
      await expect(service.create(dto as any)).rejects.toThrow(NotFoundException);
    });

    it(' ❌ 1.5 should throw BadRequestException if version does not belong to movie', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, versions: [{ id: 99 }] });
      mockCinemaRoomRepo.findOne.mockResolvedValue({ id: 2, cinema_room_name: 'Room A' });
      mockVersionRepo.findOne.mockResolvedValue({ id: 3 });
      await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);
    });

    it(' ❌ 1.6 should throw BadRequestException if overlapping schedule exists', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, versions: [{ id: 3 }] });
      mockCinemaRoomRepo.findOne.mockResolvedValue({ id: 2, cinema_room_name: 'Room A' });
      mockVersionRepo.findOne.mockResolvedValue({ id: 3 });
      mockScheduleRepo.createQueryBuilder().getOne.mockResolvedValue({ id: 10 });
      await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('2.find', () => {
    it('✅ 2.2 should return summarized schedules', async () => {
      const data = [{
        id: 1,
        is_deleted: false,
        cinemaRoom: { id: 2, cinema_room_name: 'Room' },
        movie: { id: 3, name: 'Movie' },
        version: { id: 4, name: '2D' },
        start_movie_time: '2025-06-10 14:00',
        end_movie_time: '2025-06-10 16:00',
      }];
      mockScheduleRepo.find.mockResolvedValue(data);
      const result = await service.find();
      expect(result[0]).toMatchObject({
        id: 1,
        is_deleted: false,
        cinemaRoom: { id: 2, name: 'Room' },
        start_movie_time: data[0].start_movie_time,
        movie: { id: 3, name: 'Movie' },
        version: { id: 4, name: '2D' },
      });
    });
  });

  describe('3. findOut', () => {
    it('✅ 3.1 should return summarized schedule by id', async () => {
      const schedule = {
        id: 1,
        is_deleted: false,
        cinemaRoom: { id: 2, cinema_room_name: 'Room' },
        movie: { id: 3, name: 'Movie', versions: [] },
        version: { id: 4, name: '2D' },
        start_movie_time: '2025-06-10 14:00',
        end_movie_time: '2025-06-10 16:00',
      };
      mockScheduleRepo.findOne.mockResolvedValue(schedule);
      const result = await service.findOut(1);
      expect(result).toMatchObject({
        id: 1,
        cinemaRoom: { id: 2, name: 'Room' },
        movie: { id: 3, name: 'Movie' },
        version: { id: 4, name: '2D' },
      });
    });

    it(' ❌ 3.2 should throw NotFoundException if not found', async () => {
      mockScheduleRepo.findOne.mockResolvedValue(undefined);
      await expect(service.findOut(100)).rejects.toThrow(NotFoundException);
    });
  });

  describe(' 4.update', () => {
    const schedule = {
      id: 1,
      start_movie_time: new Date('2025-06-10 14:00'),
      end_movie_time: new Date('2025-06-10 16:00'),
      movie: { id: 3, name: 'Old' },
      cinemaRoom: { id: 2, cinema_room_name: 'Room' },
    };
    it('✅ 4.1 should update schedule times', async () => {
      mockScheduleRepo.findOne.mockResolvedValue({ ...schedule });
      mockScheduleRepo.save.mockResolvedValue({});
      const dto = { start_movie_time: '2025-07-10 15:00', end_movie_time: '2025-07-10 17:00' };
      const result = await service.update(1, dto as any);
      expect(result).toEqual({ message: 'update successfully schedule' });
    });

    it('✅ 4.2 should update movie and cinemaRoom if ids provided', async () => {
      mockScheduleRepo.findOne.mockResolvedValue({ ...schedule });
      mockMovieRepo.findOne.mockResolvedValue({ id: 10, name: 'NewMovie' });
      mockCinemaRoomRepo.findOne.mockResolvedValue({ id: 8, cinema_room_name: 'NewRoom' });
      mockScheduleRepo.save.mockResolvedValue({});
      const dto = { movie_id: 10, cinema_room_id: 8 };
      const result = await service.update(1, dto as any);
      expect(result).toEqual({ message: 'update successfully schedule' });
    });

    it(' ❌ 4.3 should throw NotFoundException if schedule not found', async () => {
      mockScheduleRepo.findOne.mockResolvedValue(undefined);
      await expect(service.update(1, {} as any)).rejects.toThrow(NotFoundException);
    });

    it(' ❌ 4.4 should throw NotFoundException if movie not found', async () => {
      mockScheduleRepo.findOne.mockResolvedValue({ ...schedule });
      mockMovieRepo.findOne.mockResolvedValue(undefined);
      const dto = { movie_id: 99 };
      await expect(service.update(1, dto as any)).rejects.toThrow(NotFoundException);
    });

    it(' ❌ 4.5 should throw NotFoundException if cinema room not found', async () => {
      mockScheduleRepo.findOne.mockResolvedValue({ ...schedule });
      mockMovieRepo.findOne.mockResolvedValue({ id: 10, name: 'Movie' });
      mockCinemaRoomRepo.findOne.mockResolvedValue(undefined);
      const dto = { movie_id: 10, cinema_room_id: 88 };
      await expect(service.update(1, dto as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe(' 5.softDelete', () => {
    it('✅ 5.1 should soft delete a schedule', async () => {
      mockScheduleRepo.softDelete.mockResolvedValue({ affected: 1 });
      await expect(service.softDelete(1)).resolves.toBeUndefined();
    });
    it('❌ 5.2 should throw NotFoundException if not found', async () => {
      mockScheduleRepo.softDelete.mockResolvedValue({ affected: 0 });
      await expect(service.softDelete(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe(' 6.softDeleteSchedule', () => {
    it('✅ 6.1 should soft-delete a schedule', async () => {
      mockScheduleRepo.findOne.mockResolvedValue({ id: 1, is_deleted: false });
      mockScheduleRepo.save.mockResolvedValue({ id: 1, is_deleted: true });
      const result = await service.softDeleteSchedule(1);
      expect(result).toEqual({ msg: 'Schedule soft-deleted successfully' });
    });
    it('❌ 6.2 should throw NotFoundException if not found', async () => {
      mockScheduleRepo.findOne.mockResolvedValue(undefined);
      await expect(service.softDeleteSchedule(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe(' 7.restoreSchedule', () => {
    it('✅ 7.1 should restore a soft-deleted schedule', async () => {
      mockScheduleRepo.findOne.mockResolvedValue({ id: 1, is_deleted: true });
      mockScheduleRepo.save.mockResolvedValue({ id: 1, is_deleted: false });
      const result = await service.restoreSchedule(1);
      expect(result).toEqual({ msg: 'Schedule restored successfully', schedule: { id: 1, is_deleted: false } });
    });
    it('❌ 7.2 should throw NotFoundException if not found', async () => {
      mockScheduleRepo.findOne.mockResolvedValue(undefined);
      await expect(service.restoreSchedule(1)).rejects.toThrow(NotFoundException);
    });
    it('❌ 7.3 should throw BadRequestException if not soft-deleted', async () => {
      mockScheduleRepo.findOne.mockResolvedValue({ id: 1, is_deleted: false });
      await expect(service.restoreSchedule(1)).rejects.toThrow(BadRequestException);
    });
  });
});