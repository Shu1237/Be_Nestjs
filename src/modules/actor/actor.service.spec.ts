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
        getRawOne: jest.fn().mockResolvedValue({ activeCount: '0', deletedCount: '0' }),
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
      (mockActorRepo.create as jest.Mock).mockReturnValue({ name: 'Test Actor' });
      (mockActorRepo.save as jest.Mock).mockResolvedValue({ name: 'Test Actor' });
      const createActorDto = {
        name: 'Test Actor',
        gender: Gender.MALE,
        date_of_birth: new Date('1990-01-01'),
        nationality: 'American',
        biography: 'Test biography',
        profile_image: 'test.jpg'
      };
      const result = await service.createActor(createActorDto);
      expect(result).toEqual({ msg: 'Actor created successfully' });
    });
    it('❌ 1.2 should throw BadRequestException if actor name exists', async () => {
      (mockActorRepo.findOneBy as jest.Mock).mockResolvedValue({ id: 1, name: 'Test Actor' });
      await expect(service.createActor({
        name: 'Test Actor',
        gender: Gender.MALE,
        date_of_birth: new Date('1990-01-01'),
        nationality: 'American',
        biography: 'Test biography',
        profile_image: 'test.jpg'
      })).rejects.toThrow(BadRequestException);
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
      (mockActorRepo.find as jest.Mock).mockResolvedValue([{ id: 1, name: 'Brad' }]);
      const result = await service.findActorByName('Brad');
      expect(result).toEqual([{ id: 1, name: 'Brad' }]);
      expect(mockActorRepo.find).toHaveBeenCalledWith({
        where: { name: Like('%Brad%') },
        select: ['id', 'name'],
      });
    });
    it('❌ 3.2 should throw NotFoundException if no actors found', async () => {
      (mockActorRepo.find as jest.Mock).mockResolvedValue(undefined);
      await expect(service.findActorByName('Unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('4.updateActor', () => {
    it('✅ 4.1 should update an actor successfully', async () => {
      service.findActorById = jest.fn().mockResolvedValue({ id: 2, name: 'Another' });
      (mockActorRepo.findOneBy as jest.Mock).mockResolvedValue(undefined);
      (mockActorRepo.save as jest.Mock).mockResolvedValue({ id: 2, name: 'Updated' });
      const result = await service.updateActor(2, { name: 'Updated' });
      expect(result).toEqual({ msg: 'Actor updated successfully' });
    });
    it('❌ 4.2 should throw BadRequestException if duplicate name found', async () => {
      service.findActorById = jest.fn().mockResolvedValue({ id: 2, name: 'Another' });
      (mockActorRepo.findOneBy as jest.Mock).mockResolvedValue({ id: 3, name: 'Duplicate' });
      await expect(service.updateActor(2, { name: 'Duplicate' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('5.softDeleteActor', () => {
    it('✅ 5.1 should soft delete an actor', async () => {
      service.findActorById = jest.fn().mockResolvedValue({ id: 1, is_deleted: false });
      (mockActorRepo.save as jest.Mock).mockResolvedValue({ id: 1, is_deleted: true });
      const result = await service.softDeleteActor(1);
      expect(result).toEqual({ msg: 'Actor soft deleted successfully' });
    });
    it('❌ 5.2 should throw BadRequestException if actor already soft deleted', async () => {
      service.findActorById = jest.fn().mockResolvedValue({ id: 1, is_deleted: true });
      await expect(service.softDeleteActor(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('6.restoreActor', () => {
    it('✅ 6.1 should restore a soft-deleted actor', async () => {
      (mockActorRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, is_deleted: true });
      (mockActorRepo.save as jest.Mock).mockResolvedValue({ id: 1, is_deleted: false });
      const result = await service.restoreActor(1);
      expect(result).toEqual({ msg: 'Actor restored successfully' });
    });
    it('❌ 6.2 should throw NotFoundException if actor not found', async () => {
      (mockActorRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.restoreActor(999)).rejects.toThrow(NotFoundException);
    });
    it('❌ 6.3 should throw BadRequestException if actor is not soft deleted', async () => {
      (mockActorRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, is_deleted: false });
      await expect(service.restoreActor(1)).rejects.toThrow(BadRequestException);
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
});