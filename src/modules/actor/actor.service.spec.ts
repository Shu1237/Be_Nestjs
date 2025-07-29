import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActorService } from './actor.service';
import { Actor } from '../../database/entities/cinema/actor';
import { Repository, Like } from 'typeorm';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { Gender } from 'src/common/utils/type';

describe('ActorService', () => {
  let service: ActorService;
  let mockActorRepo: Partial<Record<keyof Repository<Actor>, jest.Mock>>;

  beforeEach(async () => {
    mockActorRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
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
        ActorService,
        { provide: getRepositoryToken(Actor), useValue: mockActorRepo },
      ],
    }).compile();

    service = module.get<ActorService>(ActorService);
  });

  describe('1.createActor', () => {
    it('✅ 1.1 should create a new actor', async () => {
      (mockActorRepo.findOneBy as jest.Mock).mockResolvedValue(undefined);
      (mockActorRepo.create as jest.Mock).mockReturnValue({
        name: 'Test Actor',
      });
      (mockActorRepo.save as jest.Mock).mockResolvedValue({
        name: 'Test Actor',
      });
      const createActorDto = {
        name: 'Test Actor',
        gender: Gender.MALE,
        date_of_birth: new Date('1990-01-01'),
        nationality: 'American',
        biography: 'Test biography',
        profile_image: 'test.jpg',
      };
      const result = await service.createActor(createActorDto);
      expect(result).toEqual({ msg: 'Actor created successfully' });
    });
    it('❌ 1.2 should throw BadRequestException if actor name exists', async () => {
      (mockActorRepo.findOneBy as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test Actor',
      });
      await expect(
        service.createActor({
          name: 'Test Actor',
          gender: Gender.MALE,
          date_of_birth: new Date('1990-01-01'),
          nationality: 'American',
          biography: 'Test biography',
          profile_image: 'test.jpg',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('1.1.createActor edge cases', () => {
    it('❌ 1.1.1 should throw if createActorDto is null', async () => {
      await expect(service.createActor(null as any)).rejects.toThrow();
    });

    it('❌ 1.1.3 should throw if repo throws error', async () => {
      (mockActorRepo.findOneBy as jest.Mock).mockRejectedValue(
        new Error('DB error'),
      );
      await expect(
        service.createActor({
          name: 'A',
          gender: Gender.MALE,
          date_of_birth: new Date(),
          nationality: '',
          biography: '',
          profile_image: '',
        } as any),
      ).rejects.toThrow('DB error');
    });
    it('❌ 1.1.4 should throw if save throws error', async () => {
      (mockActorRepo.findOneBy as jest.Mock).mockResolvedValue(undefined);
      (mockActorRepo.create as jest.Mock).mockReturnValue({ name: 'A' });
      (mockActorRepo.save as jest.Mock).mockRejectedValue(
        new Error('Save error'),
      );
      await expect(
        service.createActor({
          name: 'A',
          gender: Gender.MALE,
          date_of_birth: new Date(),
          nationality: '',
          biography: '',
          profile_image: '',
        } as any),
      ).rejects.toThrow('Save error');
    });
  });

  describe('2.findActorById', () => {
    it('✅ 2.1 should return the actor if found', async () => {
      (mockActorRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      expect(await service.findActorById(1)).toEqual({ id: 1 });
    });
    it('❌ 2.2 should throw NotFoundException if not found', async () => {
      (mockActorRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.findActorById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('3.findActorByName', () => {
    it('✅ 3.1 should return actors with matching name', async () => {
      (mockActorRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, name: 'Brad' },
      ]);
      const result = await service.findActorByName('Brad');
      expect(result).toEqual([{ id: 1, name: 'Brad' }]);
      expect(mockActorRepo.find).toHaveBeenCalledWith({
        where: { name: Like('%Brad%') },
        select: ['id', 'name'],
      });
    });
    it('❌ 3.2 should throw NotFoundException if no actors found', async () => {
      (mockActorRepo.find as jest.Mock).mockResolvedValue(undefined);
      await expect(service.findActorByName('Unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('4.updateActor', () => {
    it('✅ 4.1 should update an actor successfully', async () => {
      service.findActorById = jest
        .fn()
        .mockResolvedValue({ id: 2, name: 'Another' });
      (mockActorRepo.findOneBy as jest.Mock).mockResolvedValue(undefined);
      (mockActorRepo.save as jest.Mock).mockResolvedValue({
        id: 2,
        name: 'Updated',
      });
      const result = await service.updateActor(2, { name: 'Updated' });
      expect(result).toEqual({ msg: 'Actor updated successfully' });
    });
    it('❌ 4.2 should throw BadRequestException if duplicate name found', async () => {
      service.findActorById = jest
        .fn()
        .mockResolvedValue({ id: 2, name: 'Another' });
      (mockActorRepo.findOneBy as jest.Mock).mockResolvedValue({
        id: 3,
        name: 'Duplicate',
      });
      await expect(
        service.updateActor(2, { name: 'Duplicate' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('5.softDeleteActor', () => {
    it('✅ 5.1 should soft delete an actor', async () => {
      service.findActorById = jest
        .fn()
        .mockResolvedValue({ id: 1, is_deleted: false });
      (mockActorRepo.save as jest.Mock).mockResolvedValue({
        id: 1,
        is_deleted: true,
      });
      const result = await service.softDeleteActor(1);
      expect(result).toEqual({ msg: 'Actor soft deleted successfully' });
    });
    it('❌ 5.2 should throw BadRequestException if actor already soft deleted', async () => {
      service.findActorById = jest
        .fn()
        .mockResolvedValue({ id: 1, is_deleted: true });
      await expect(service.softDeleteActor(1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('6.restoreActor', () => {
    it('✅ 6.1 should restore a soft-deleted actor', async () => {
      (mockActorRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        is_deleted: true,
      });
      (mockActorRepo.save as jest.Mock).mockResolvedValue({
        id: 1,
        is_deleted: false,
      });
      const result = await service.restoreActor(1);
      expect(result).toEqual({ msg: 'Actor restored successfully' });
    });
    it('❌ 6.2 should throw NotFoundException if actor not found', async () => {
      (mockActorRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.restoreActor(999)).rejects.toThrow(
        NotFoundException,
      );
    });
    it('❌ 6.3 should throw BadRequestException if actor is not soft deleted', async () => {
      (mockActorRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        is_deleted: false,
      });
      await expect(service.restoreActor(1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('7.removeActor', () => {
    it('✅ 7.1 should remove an actor', async () => {
      (mockActorRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (mockActorRepo.remove as jest.Mock).mockResolvedValue({});
      await expect(service.removeActor(1)).resolves.toBeUndefined();
      expect(mockActorRepo.remove).toHaveBeenCalledWith({ id: 1 });
    });
    it('❌ 7.2 should throw NotFoundException if actor not found', async () => {
      (mockActorRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.removeActor(123)).rejects.toThrow(NotFoundException);
    });
  });

  describe('1.2.getAllActorsUser', () => {
    it('✅ 1.2.1 should return empty array if no actors', async () => {
      (mockActorRepo.find as jest.Mock).mockResolvedValue([]);
      expect(await service.getAllActorsUser()).toEqual([]);
    });
    it('✅ 1.2.2 should return actors if exist', async () => {
      (mockActorRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, name: 'A' },
      ]);
      expect(await service.getAllActorsUser()).toEqual([{ id: 1, name: 'A' }]);
    });
    it('❌ 1.2.3 should throw if repo throws error', async () => {
      (mockActorRepo.find as jest.Mock).mockRejectedValue(
        new Error('DB error'),
      );
      await expect(service.getAllActorsUser()).rejects.toThrow('DB error');
    });
  });

  describe('1.3.getAllActors', () => {
    it('✅ 1.3.1 should return paginated actors', async () => {
      (mockActorRepo.createQueryBuilder as jest.Mock).mockReturnValue({
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
        sortBy: 'name',
        sortOrder: 'ASC',
      } as any;
      const result = await service.getAllActors(filters);
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });
    it('❌ 1.3.2 should handle page/take = 0', async () => {
      const filters = { page: 0, take: 0 } as any;
      await expect(service.getAllActors(filters)).resolves.toBeDefined();
    });
    it('❌ 1.3.3 should handle negative page/take', async () => {
      const filters = { page: -1, take: -5 } as any;
      await expect(service.getAllActors(filters)).resolves.toBeDefined();
    });
    it('❌ 1.3.4 should handle missing filters', async () => {
      await expect(service.getAllActors(undefined as any)).rejects.toThrow();
    });
  });

  // BỔ SUNG THÊM UNIT TEST CHO getAllActors (edge case, filter, sort, count null, v.v.)
  describe('1.3.getAllActors additional edge cases', () => {
    it('❌ 1.3.5 should handle allowedSortFields with invalid sortBy', async () => {
      (mockActorRepo.createQueryBuilder as jest.Mock).mockReturnValue({
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
        sortBy: 'invalid_field',
        sortOrder: 'ASC',
      } as any;
      const result = await service.getAllActors(filters);
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });
    it('❌ 1.3.6 should handle counts is null', async () => {
      (mockActorRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
        getRawOne: jest.fn().mockResolvedValue(null),
      });
      const filters = {
        page: 1,
        take: 10,
        sortBy: 'name',
        sortOrder: 'ASC',
      } as any;
      const result = await service.getAllActors(filters);
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
      expect('activeCount' in result.meta).toBe(true);
      expect('deletedCount' in result.meta).toBe(true);
    });
    it('❌ 1.3.7 should handle getManyAndCount throws error', async () => {
      (mockActorRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockRejectedValue(new Error('getManyAndCount error')),
        getRawOne: jest
          .fn()
          .mockResolvedValue({ activeCount: '1', deletedCount: '0' }),
      });
      const filters = {
        page: 1,
        take: 10,
        sortBy: 'name',
        sortOrder: 'ASC',
      } as any;
      await expect(service.getAllActors(filters)).rejects.toThrow(
        'getManyAndCount error',
      );
    });
    it('❌ 1.3.8 should handle getRawOne throws error', async () => {
      (mockActorRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
        getRawOne: jest.fn().mockRejectedValue(new Error('getRawOne error')),
      });
      const filters = {
        page: 1,
        take: 10,
        sortBy: 'name',
        sortOrder: 'ASC',
      } as any;
      await expect(service.getAllActors(filters)).rejects.toThrow(
        'getRawOne error',
      );
    });
  });
});
