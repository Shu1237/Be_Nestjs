import { Injectable } from '@nestjs/common';
import { Movie } from 'src/database/entities/cinema/movie';
import { ApiTags } from '@nestjs/swagger';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Actor } from 'src/database/entities/cinema/actor';
import { Gerne } from 'src/database/entities/cinema/gerne';
import { UpdateMovieDto } from './dtos/updateMovie.dto';
import { CreateMovieDto } from './dtos/createMovie.dto';
import { Version } from 'src/database/entities/cinema/version';
import { IMovie } from 'src/common/utils/type';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { MoviePaginationDto } from 'src/common/pagination/dto/movie/moviePagination.dto';
import { applyCommonFilters } from 'src/common/pagination/applyCommonFilters';
import { movieFieldMapping } from 'src/common/pagination/fillters/movieFieldMapping';
import { applySorting } from 'src/common/pagination/apply_sort';
import { applyPagination } from 'src/common/pagination/applyPagination';
import { buildPaginationResponse } from 'src/common/pagination/pagination-response';

@ApiTags('Movies')
@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(Actor)
    private readonly actorRepository: Repository<Actor>,
    @InjectRepository(Gerne)
    private readonly gerneRepository: Repository<Gerne>,
    @InjectRepository(Version)
    private readonly versionRepository: Repository<Version>,

  ) { }
  private getMovieSummary(movie: IMovie) {
    return {
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
      actors: movie.actors.map((actor) => ({
        id: actor.id,
        name: actor.name,
      })),
      gernes: movie.gernes.map((gerne) => ({
        id: gerne.id,
        genre_name: gerne.genre_name,
      })),
      versions: movie.versions.map((version) => ({
        id: version.id,
        name: version.name,
      })),
    };
  }
  async getAllMoviesUser() {
    const movies = await this.movieRepository.find({
      where: { is_deleted: false },
      relations: ['gernes', 'actors', 'versions'],
    });
    return movies.map((movie) => this.getMovieSummary(movie));
  } 
  async getAllMovies(fillters: MoviePaginationDto) {
    const qb = this.movieRepository.createQueryBuilder('movie')
      .leftJoinAndSelect('movie.actors', 'actor')
      .leftJoinAndSelect('movie.gernes', 'gerne')
      .leftJoinAndSelect('movie.versions', 'version');

    applyCommonFilters(qb, fillters, movieFieldMapping);

    const allowedFields = [
      'movie.id',
      'movie.name',
      'movie.director',
      'movie.nation',
    ];
    applySorting(qb, fillters.sortBy, fillters.sortOrder, allowedFields, 'movie.name');
    applyPagination(qb, {
      page: fillters.page,
      take: fillters.take,
    })
    const [movies, total] = await qb.getManyAndCount();
    const summaries = movies.map((movie) => this.getMovieSummary(movie));
    const counts = await this.movieRepository
      .createQueryBuilder('movie')
      .select([
        `SUM(CASE WHEN movie.is_deleted = false THEN 1 ELSE 0 END) AS activeCount`,
        `SUM(CASE WHEN movie.is_deleted = true THEN 1 ELSE 0 END) AS deletedCount`,
      ])
      .getRawOne();

    const activeCount = Number(counts.activeCount) || 0;
    const deletedCount = Number(counts.deletedCount) || 0;
    return buildPaginationResponse(summaries, {
      total,
      page: fillters.page,
      take: fillters.take,
      activeCount,
      deletedCount,
    })
  }

  async getMovieById(id: number): Promise<IMovie> {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['gernes', 'actors', 'versions'], // Lấy các quan hệ liên quan
    });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    // Gói gọn dữ liệu trả về
    return this.getMovieSummary(movie);
  }

  async createMovie(movieDto: CreateMovieDto): Promise<{ msg: string }> {
    try {
      const existingMovie = await this.movieRepository.findOne({
        where: { name: movieDto.name },
      });

      if (existingMovie) {
        throw new BadRequestException(
          `Movie with name "${movieDto.name}" already exists.`,
        );
      }
      const movie = this.movieRepository.create(movieDto);

      // Nếu có danh sách id_Actor, thêm diễn viên vào bộ phim
      if (movieDto.id_Actor) {
        const actors = await this.actorRepository.find({
          where: { id: In(movieDto.id_Actor) },
          select: ['id', 'name'],
        });
        if (actors.length === 0) {
          throw new NotFoundException(
            `No actors found with the provided IDs: [${movieDto.id_Actor.join(', ')}]`,
          );
        }
        movie.actors = actors;
      }

      // Nếu có danh sách id_Gerne, thêm thể loại vào bộ phim
      if (movieDto.id_Gerne) {
        const gernes = await this.gerneRepository.find({
          where: { id: In(movieDto.id_Gerne) },
          select: ['id', 'genre_name'],
        });
        if (gernes.length === 0) {
          throw new NotFoundException(
            `No genres found with the provided IDs: [${movieDto.id_Gerne.join(', ')}]`,
          );
        }
        movie.gernes = gernes;
      }

      // Nếu có danh sách id_Version, thêm phiên bản vào bộ phim
      if (movieDto.id_Version) {
        const versions = await this.versionRepository.find({
          where: { id: In(movieDto.id_Version) },
          select: ['id', 'name'],
        });
        if (versions.length === 0) {
          throw new NotFoundException(
            `No versions found with the provided IDs: [${movieDto.id_Version.join(', ')}]`,
          );
        }
        movie.versions = versions;
      }

      await this.movieRepository.save(movie);
      return {
        msg: 'Movie created successfully',
      };
    } catch (error) {
      // Nếu là lỗi đã throw ở trên thì trả về luôn
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      // Nếu là lỗi validate hoặc lỗi DB khác
      throw new BadRequestException(
        error.message || 'Unknown error when creating movie',
      );
    }
  }

  async updateMovie(
    id: number,
    movieDto: UpdateMovieDto,
  ): Promise<{ msg: string }> {
    const existingMovie = await this.movieRepository.findOne({
      where: { id },
      relations: ['gernes', 'actors', 'versions'],
    });

    if (!existingMovie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    Object.assign(existingMovie, movieDto);

    // Cập nhật danh sách diễn viên
    if (movieDto.id_Actor) {
      const actors = await this.actorRepository.find({
        where: { id: In(movieDto.id_Actor) },
        select: ['id', 'name'],
      });
      if (actors.length === 0) {
        throw new NotFoundException(`No actors found with the provided IDs`);
      }
      existingMovie.actors = actors;
    }

    // Cập nhật danh sách thể loại
    if (movieDto.id_Gerne) {
      const gernes = await this.gerneRepository.find({
        where: { id: In(movieDto.id_Gerne) },
        select: ['id', 'genre_name'],
      });
      if (gernes.length === 0) {
        throw new NotFoundException(`No genres found with the provided IDs`);
      }
      existingMovie.gernes = gernes;
    }

    // Cập nhật danh sách phiên bản
    if (movieDto.id_Version) {
      const versions = await this.versionRepository.find({
        where: { id: In(movieDto.id_Version) },
        select: ['id', 'name'],
      });
      if (versions.length === 0) {
        throw new NotFoundException(`No versions found with the provided IDs`);
      }
      existingMovie.versions = versions;
    }

    await this.movieRepository.save(existingMovie);
    // Trả về dữ liệu đã gói gọn
    return {
      msg: 'Movie updated successfully',
    };
  }

  async deleteMovie(id: number) {
    const result = await this.movieRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return { msg: 'Movie deleted successfully' };
  }

  async softDeleteMovie(id: number) {
    const movie = await this.getMovieById(id);
    movie.is_deleted = true;
    await this.movieRepository.save(movie);
    return { msg: 'Movie soft-deleted successfully', movie };
  }

  async restoreMovie(id: number) {
    const movie = await this.movieRepository.findOne({ where: { id } });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    if (!movie.is_deleted) {
      throw new BadRequestException(
        `Movie with ID ${id} is not soft-deleted`,
      );
    }
    movie.is_deleted = false;
    await this.movieRepository.save(movie);
    return { msg: 'Movie restored successfully', movie };
  }

  async getActorsOfMovie(
    movieId: number,
  ): Promise<{ id: number; name: string }[]> {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['actors'],
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }

    // Chỉ lấy `id` và `name` của các Actor
    return movie.actors.map((actor) => ({ id: actor.id, name: actor.name }));
  }

  async removeActorFromMovie(movieId: number, actorId: number): Promise<Movie> {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['actors'],
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }

    const actor = await this.actorRepository.findOne({
      where: { id: actorId },
    });

    if (!actor) {
      throw new NotFoundException(`Actor with ID ${actorId} not found`);
    }

    // Remove the actor from the movie's actors list
    movie.actors = movie.actors.filter(
      (existingActor) => existingActor.id !== actorId,
    );

    return await this.movieRepository.save(movie);
  }

  async getGernesOfMovie(movieId: number): Promise<Gerne[]> {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['gernes'],
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }

    return movie.gernes;
  }
  async removeGerneFromMovie(movieId: number, gerneId: number): Promise<Movie> {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['gernes'], // Lấy danh sách thể loại liên quan
    });

    const gerne = await this.gerneRepository.findOne({
      where: { id: gerneId },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }

    if (!gerne) {
      throw new NotFoundException(`Gerne with ID ${gerneId} not found`);
    }

    // Kiểm tra nếu thể loại không tồn tại trong danh sách của phim
    const isGerneInMovie = movie.gernes.some(
      (existingGerne) => existingGerne.id === gerneId,
    );
    if (!isGerneInMovie) {
      throw new BadRequestException(
        `Gerne with ID ${gerneId} is not associated with the movie.`,
      );
    }

    // Xóa thể loại khỏi danh sách
    movie.gernes = movie.gernes.filter(
      (existingGerne) => existingGerne.id !== gerneId,
    );
    return await this.movieRepository.save(movie);
  }

  async getVersionsOfMovie(movieId: number): Promise<Version[]> {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['versions'], // Lấy danh sách phiên bản liên quan
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }

    return movie.versions;
  }


  async getMoviesPaginated(
    page = 1,
    limit = 10,
  ): Promise<{ data: IMovie[]; total: number; page: number; limit: number }> {
    const [movies, total] = await this.movieRepository.findAndCount({
      relations: ['gernes', 'actors', 'versions'],
      skip: (page - 1) * limit,
      take: limit,
      order: {
        id: 'DESC',
      },
    });
    return {
      data: movies.map((movie) => this.getMovieSummary(movie)),
      total,
      page,
      limit,
    };
  }
}
