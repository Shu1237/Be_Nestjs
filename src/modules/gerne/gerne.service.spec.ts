import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GerneService } from './gerne.service';
import { Gerne } from 'src/database/entities/cinema/gerne';
import { Repository } from 'typeorm';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { Movie } from 'src/database/entities/cinema/movie';

describe('GerneService', () => {
  let service: GerneService;
  let mockGerneRepo: Partial<Record<keyof Repository<Gerne>, jest.Mock>>;

  beforeEach(async () => {
    mockGerneRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GerneService,
        { provide: getRepositoryToken(Gerne), useValue: mockGerneRepo },
      ],
    }).compile();

    service = module.get<GerneService>(GerneService);
  });

  describe('1.createGerne', () => {
    it('✅ 1.1 should create a new gerne', async () => {
      (mockGerneRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockGerneRepo.create as jest.Mock).mockReturnValue({ genre_name: 'Action' });
      (mockGerneRepo.save as jest.Mock).mockResolvedValue({ genre_name: 'Action' });
      const result = await service.createGerne({ genre_name: 'Action' });
      expect(result).toEqual({ msg: 'Gerne created successfully' });
    });
    it('❌ 1.2 should throw BadRequestException if gerne name exists', async () => {
      (mockGerneRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, genre_name: 'Action' });
      await expect(service.createGerne({ genre_name: 'Action' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('2.findGerneById', () => {
    it('✅ 2.1 should return the gerne if found', async () => {
      (mockGerneRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      expect(await service.findGerneById(1)).toEqual({ id: 1 });
    });
    it('❌ 2.2 should throw NotFoundException if not found', async () => {
      (mockGerneRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.findGerneById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('3.updateGerne', () => {
    it('✅ 3.1 should update a gerne successfully', async () => {
      service.findGerneById = jest.fn().mockResolvedValue({ id: 1, genre_name: 'Old', is_deleted: false });
      (mockGerneRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockGerneRepo.save as jest.Mock).mockResolvedValue({ id: 1, genre_name: 'New' });
      const result = await service.updateGerne(1, { genre_name: 'New' });
      expect(result).toEqual({ msg: 'Gerne updated successfully' });
    });
    it('❌ 3.2 should throw error if new name already exists', async () => {
      service.findGerneById = jest.fn().mockResolvedValue({ id: 1, genre_name: 'Old' });
      (mockGerneRepo.findOne as jest.Mock).mockResolvedValue({ id: 2, genre_name: 'New' });
      await expect(service.updateGerne(1, { genre_name: 'New' })).rejects.toThrow(Error);
    });
    it('✅ 3.3 should update gerne if name not being changed', async () => {
      service.findGerneById = jest.fn().mockResolvedValue({ id: 1, genre_name: 'Same' });
      (mockGerneRepo.save as jest.Mock).mockResolvedValue({ id: 1, genre_name: 'Same' });
      const result = await service.updateGerne(1, { genre_name: 'Same' });
      expect(result).toEqual({ msg: 'Gerne updated successfully' });
    });
  });

  describe('4.deleteGerne', () => {
    it('✅ 4.1 should delete the gerne if found', async () => {
      (mockGerneRepo.delete as jest.Mock).mockResolvedValue({ affected: 1 });
      await expect(service.deleteGerne(1)).resolves.toBeUndefined();
    });
    it('❌ 4.2 should throw NotFoundException if not found', async () => {
      (mockGerneRepo.delete as jest.Mock).mockResolvedValue({ affected: 0 });
      await expect(service.deleteGerne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('5.softDeleteGerne', () => {
    it('✅ 5.1 should soft delete a gerne', async () => {
      const gerne = { id: 1, is_deleted: false };
      (mockGerneRepo.findOne as jest.Mock).mockResolvedValue(gerne);
      (mockGerneRepo.save as jest.Mock).mockResolvedValue({ ...gerne, is_deleted: true });
      const result = await service.softDeleteGerne(1);
      expect(result).toEqual({ msg: 'Gerne soft-deleted successfully', gerne });
    });
    it('❌ 5.2 should throw NotFoundException if not found', async () => {
      (mockGerneRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.softDeleteGerne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('6.restoreGerne', () => {
    it('✅ 6.1 should restore a soft-deleted gerne', async () => {
      const gerne = { id: 1, is_deleted: true };
      (mockGerneRepo.findOne as jest.Mock).mockResolvedValue(gerne);
      (mockGerneRepo.save as jest.Mock).mockResolvedValue({ ...gerne, is_deleted: false });
      const result = await service.restoreGerne(1);
      expect(result).toEqual({ msg: 'Gerne restored successfully', gerne });
    });
    it('❌ 6.2 should throw NotFoundException if not found', async () => {
      (mockGerneRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.restoreGerne(1)).rejects.toThrow(NotFoundException);
    });
    it('❌ 6.3 should throw BadRequestException if gerne is not soft-deleted', async () => {
      (mockGerneRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, is_deleted: false });
      await expect(service.restoreGerne(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('7.getMoviesOfGerne', () => {
    it('✅ 7.1 should return movies of gerne', async () => {
      const movies = [{ id: 1, title: 'Movie 1' }];
      (mockGerneRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, movies });
      expect(await service.getMoviesOfGerne(1)).toEqual(movies);
    });
    it('❌ 7.2 should throw NotFoundException if gerne not found', async () => {
      (mockGerneRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.getMoviesOfGerne(1)).rejects.toThrow(NotFoundException);
    });
  });
});