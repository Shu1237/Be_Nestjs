import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MovieService } from './movie.service';
import { Movie } from 'src/database/entities/cinema/movie';
import { Actor } from 'src/database/entities/cinema/actor';
import { Gerne } from 'src/database/entities/cinema/gerne';
import { Version } from 'src/database/entities/cinema/version';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';

describe('MovieService', () => {
  let service: MovieService;
  let mockMovieRepo: any;
  let mockActorRepo: any;
  let mockGerneRepo: any;
  let mockVersionRepo: any;

  beforeEach(async () => {
    mockMovieRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ activeCount: 0, deletedCount: 0 })
      }),
    };
    mockActorRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    mockGerneRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    mockVersionRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieService,
        { provide: getRepositoryToken(Movie), useValue: mockMovieRepo },
        { provide: getRepositoryToken(Actor), useValue: mockActorRepo },
        { provide: getRepositoryToken(Gerne), useValue: mockGerneRepo },
        { provide: getRepositoryToken(Version), useValue: mockVersionRepo },
      ],
    }).compile();

    service = module.get<MovieService>(MovieService);
  });

  describe('1.getMovieById', () => {
    it('✅ 1.1 should return the movie summary if found', async () => {
      const movie = {
        id: 1,
        name: 'Movie1',
        content: '',
        director: '',
        duration: 120,
        from_date: new Date(),
        limited_age: 13,
        trailer: '',
        nation: '',
        to_date: new Date(),
        production_company: '',
        thumbnail: '',
        banner: '',
        is_deleted: false,
        actors: [{ id: 1, name: 'A' }],
        gernes: [{ id: 1, genre_name: 'G' }],
        versions: [{ id: 1, name: 'V' }]
      };
      mockMovieRepo.findOne.mockResolvedValue(movie);
      const result = await service.getMovieById(1);
      expect(result).toEqual({
        id: movie.id,
        name: movie.name,
        content: movie.content,
        director: movie.director,
        duration: movie.duration,
        from_date: movie.from_date,
        limited_age: movie.limited_age,
        trailer: movie.trailer,
        nation: movie.nation,
        to_date: movie.to_date,
        production_company: movie.production_company,
        thumbnail: movie.thumbnail,
        banner: movie.banner,
        is_deleted: movie.is_deleted,
        actors: [{ id: 1, name: 'A' }],
        gernes: [{ id: 1, genre_name: 'G' }],
        versions: [{ id: 1, name: 'V' }]
      });
    });
    it('❌ 1.2 should throw NotFoundException if not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue(undefined);
      await expect(service.getMovieById(11)).rejects.toThrow(NotFoundException);
    });
  });

  describe('2.createMovie', () => {
    it('✅ 2.1 should create a movie successfully', async () => {
      mockMovieRepo.findOne.mockResolvedValue(undefined);
      mockMovieRepo.create.mockReturnValue({});
      mockActorRepo.find.mockResolvedValue([{ id: 1, name: 'A' }]);
      mockGerneRepo.find.mockResolvedValue([{ id: 2, genre_name: 'G' }]);
      mockVersionRepo.find.mockResolvedValue([{ id: 3, name: 'V' }]);
      mockMovieRepo.save.mockResolvedValue({});

      const dto = { name: 'N', id_Actor: [1], id_Gerne: [2], id_Version: [3] };
      const result = await service.createMovie(dto as any);
      expect(result).toEqual({ msg: 'Movie created successfully' });
    });

    it('❌ 2.2 should throw BadRequestException if movie name exists', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, name: 'N' });
      await expect(service.createMovie({ name: 'N' } as any)).rejects.toThrow(BadRequestException);
    });

    it('❌ 2.3 should throw NotFoundException if actor IDs not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue(undefined);
      mockMovieRepo.create.mockReturnValue({});
      mockActorRepo.find.mockResolvedValue([]);
      await expect(service.createMovie({ name: 'N', id_Actor: [1] } as any)).rejects.toThrow(NotFoundException);
    });

    it('❌ 2.4 should throw NotFoundException if gerne IDs not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue(undefined);
      mockMovieRepo.create.mockReturnValue({});
      mockActorRepo.find.mockResolvedValue([{ id: 1, name: 'A' }]);
      mockGerneRepo.find.mockResolvedValue([]);
      await expect(service.createMovie({ name: 'N', id_Actor: [1], id_Gerne: [2] } as any)).rejects.toThrow(NotFoundException);
    });

    it('❌ 2.5 should throw NotFoundException if version IDs not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue(undefined);
      mockMovieRepo.create.mockReturnValue({});
      mockActorRepo.find.mockResolvedValue([{ id: 1, name: 'A' }]);
      mockGerneRepo.find.mockResolvedValue([{ id: 2, genre_name: 'G' }]);
      mockVersionRepo.find.mockResolvedValue([]);
      await expect(service.createMovie({ name: 'N', id_Actor: [1], id_Gerne: [2], id_Version: [3] } as any)).rejects.toThrow(NotFoundException);
    });

    it('❌ 2.6 should throw BadRequestException for unknown errors', async () => {
      mockMovieRepo.findOne.mockImplementation(() => { throw new Error('fail'); });
      await expect(service.createMovie({ name: 'N' } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('3.updateMovie', () => {
    it('✅ 3.1 should update a movie successfully', async () => {
      mockMovieRepo.findOne.mockResolvedValue({
        id: 1,
        actors: [],
        gernes: [],
        versions: [],
      });
      mockActorRepo.find.mockResolvedValue([{ id: 1, name: 'A' }]);
      mockGerneRepo.find.mockResolvedValue([{ id: 2, genre_name: 'G' }]);
      mockVersionRepo.find.mockResolvedValue([{ id: 3, name: 'V' }]);
      mockMovieRepo.save.mockResolvedValue({});
      const dto = { id_Actor: [1], id_Gerne: [2], id_Version: [3] };
      const result = await service.updateMovie(1, dto as any);
      expect(result).toEqual({ msg: 'Movie updated successfully' });
    });

    it('❌ 3.2 should throw NotFoundException if movie not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue(undefined);
      await expect(service.updateMovie(1, {} as any)).rejects.toThrow(NotFoundException);
    });

    it('❌ 3.3 should throw NotFoundException if actor IDs not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, actors: [], gernes: [], versions: [] });
      mockActorRepo.find.mockResolvedValue([]);
      await expect(service.updateMovie(1, { id_Actor: [1] } as any)).rejects.toThrow(NotFoundException);
    });

    it('❌ 3.4 should throw NotFoundException if gerne IDs not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, actors: [], gernes: [], versions: [] });
      mockActorRepo.find.mockResolvedValue([{ id: 1, name: 'A' }]);
      mockGerneRepo.find.mockResolvedValue([]);
      await expect(service.updateMovie(1, { id_Actor: [1], id_Gerne: [2] } as any)).rejects.toThrow(NotFoundException);
    });

    it('❌ 3.5 should throw NotFoundException if version IDs not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, actors: [], gernes: [], versions: [] });
      mockActorRepo.find.mockResolvedValue([{ id: 1, name: 'A' }]);
      mockGerneRepo.find.mockResolvedValue([{ id: 2, genre_name: 'G' }]);
      mockVersionRepo.find.mockResolvedValue([]);
      await expect(service.updateMovie(1, { id_Actor: [1], id_Gerne: [2], id_Version: [3] } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('4.deleteMovie', () => {
    it('✅ 4.1 should delete the movie if found', async () => {
      mockMovieRepo.delete.mockResolvedValue({ affected: 1 });
      const result = await service.deleteMovie(1);
      expect(result).toEqual({ msg: 'Movie deleted successfully' });
    });
    it('❌ 4.2 should throw NotFoundException if not found', async () => {
      mockMovieRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.deleteMovie(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('5.softDeleteMovie', () => {
    it('✅ 5.1 should soft delete a movie', async () => {
      service.getMovieById = jest.fn().mockResolvedValue({ id: 1, is_deleted: false });
      mockMovieRepo.save.mockResolvedValue({ id: 1, is_deleted: true });
      const result = await service.softDeleteMovie(1);
      expect(result).toEqual({ msg: 'Movie soft-deleted successfully', movie: { id: 1, is_deleted: true } });
    });
  });

  describe('5.restoreMovie', () => {
    it('✅ 5.1 should restore a soft-deleted movie', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, is_deleted: true });
      mockMovieRepo.save.mockResolvedValue({ id: 1, is_deleted: false });
      const result = await service.restoreMovie(1);
      expect(result).toEqual({ msg: 'Movie restored successfully', movie: { id: 1, is_deleted: false } });
    });
    it('❌ 5.2 should throw NotFoundException if not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue(undefined);
      await expect(service.restoreMovie(1)).rejects.toThrow(NotFoundException);
    });
    it('❌ 5.3 should throw BadRequestException if not soft-deleted', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, is_deleted: false });
      await expect(service.restoreMovie(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('6.getActorsOfMovie', () => {
    it('✅ 6.1 should return actors summary of the movie', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, actors: [{ id: 10, name: 'A' }] });
      const result = await service.getActorsOfMovie(1);
      expect(result).toEqual([{ id: 10, name: 'A' }]);
    });
    it('❌ 6.2 should throw NotFoundException if movie not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue(undefined);
      await expect(service.getActorsOfMovie(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('7.removeActorFromMovie', () => {
    it('✅ 7.1 should remove an actor from the movie', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, actors: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] });
      mockActorRepo.findOne.mockResolvedValue({ id: 1, name: 'A' });
      mockMovieRepo.save.mockResolvedValue({ id: 1, actors: [{ id: 2, name: 'B' }] });
      const result = await service.removeActorFromMovie(1, 1);
      expect(result).toEqual({ id: 1, actors: [{ id: 2, name: 'B' }] });
    });
    it('❌ 7.2 should throw NotFoundException if movie not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue(undefined);
      await expect(service.removeActorFromMovie(1, 1)).rejects.toThrow(NotFoundException);
    });
    it('❌ 7.3 should throw NotFoundException if actor not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, actors: [] });
      mockActorRepo.findOne.mockResolvedValue(undefined);
      await expect(service.removeActorFromMovie(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('8.getGernesOfMovie', () => {
    it('✅ 8.1 should return gernes of the movie', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, gernes: [{ id: 1, genre_name: 'G' }] });
      const result = await service.getGernesOfMovie(1);
      expect(result).toEqual([{ id: 1, genre_name: 'G' }]);
    });
    it('❌ 8.2 should throw NotFoundException if movie not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue(undefined);
      await expect(service.getGernesOfMovie(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('8.removeGerneFromMovie', () => {
    it('✅ 8.1 should remove a gerne from the movie', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, gernes: [{ id: 1, genre_name: 'G' }, { id: 2, genre_name: 'B' }] });
      mockGerneRepo.findOne.mockResolvedValue({ id: 2, genre_name: 'B' });
      mockMovieRepo.save.mockResolvedValue({ id: 1, gernes: [{ id: 1, genre_name: 'G' }] });
      const result = await service.removeGerneFromMovie(1, 2);
      expect(result).toEqual({ id: 1, gernes: [{ id: 1, genre_name: 'G' }] });
    });
    it('❌ 8.2 should throw NotFoundException if movie not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue(undefined);
      await expect(service.removeGerneFromMovie(1, 1)).rejects.toThrow(NotFoundException);
    });
    it('❌ 8.3 should throw NotFoundException if gerne not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, gernes: [] });
      mockGerneRepo.findOne.mockResolvedValue(undefined);
      await expect(service.removeGerneFromMovie(1, 1)).rejects.toThrow(NotFoundException);
    });
    it('❌ 8.4 should throw BadRequestException if gerne not associated with movie', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, gernes: [{ id: 2, genre_name: 'B' }] });
      mockGerneRepo.findOne.mockResolvedValue({ id: 1, genre_name: 'G' });
      await expect(service.removeGerneFromMovie(1, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('8.getVersionsOfMovie', () => {
    it('✅ 8.1 should return versions of the movie', async () => {
      mockMovieRepo.findOne.mockResolvedValue({ id: 1, versions: [{ id: 1, name: 'V' }] });
      const result = await service.getVersionsOfMovie(1);
      expect(result).toEqual([{ id: 1, name: 'V' }]);
    });
    it('❌ 8.2 should throw NotFoundException if movie not found', async () => {
      mockMovieRepo.findOne.mockResolvedValue(undefined);
      await expect(service.getVersionsOfMovie(1)).rejects.toThrow(NotFoundException);
    });
  });
});