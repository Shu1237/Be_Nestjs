import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Movie } from 'src/typeorm/entities/cinema/movie';
import { ApiTags } from '@nestjs/swagger';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Actor } from 'src/typeorm/entities/cinema/actor';
import { Gerne } from 'src/typeorm/entities/cinema/gerne';
import { UpdateMovieDto } from './dtos/updateMovie.dto';
import { CreateMovieDto } from './dtos/createMovie.dto';
import { Version } from 'src/typeorm/entities/cinema/version';
import { IMovie } from 'src/utils/type';

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
    // Injec // Inject Actor repository
  ) {}

  async getAllMovies(): Promise<IMovie[]> {
    const movies = await this.movieRepository.find({
      relations: ['gernes', 'actors', 'versions'], // Lấy các quan hệ liên quan
    });

    // Gói gọn dữ liệu trả về
    return movies.map((movie) => ({
      id: movie.id,
      name: movie.name,
      content: movie.content,
      director: movie.director,
      duration: movie.duration,
      from_date: movie.from_date,
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
    }));
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
    return {
      id: movie.id,
      name: movie.name,
      content: movie.content,
      director: movie.director,
      duration: movie.duration,
      from_date: movie.from_date,
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

  async createMovie(movieDto: CreateMovieDto): Promise<IMovie> {
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
        select: ['id', 'name'], // Chỉ lấy id và name
      });
      if (actors.length === 0) {
        throw new NotFoundException(`No actors found with the provided IDs`);
      }
      movie.actors = actors;
    }

    // Nếu có danh sách id_Gerne, thêm thể loại vào bộ phim
    if (movieDto.id_Gerne) {
      const gernes = await this.gerneRepository.find({
        where: { id: In(movieDto.id_Gerne) },
        select: ['id', 'genre_name'], // Chỉ lấy id và genre_name
      });
      if (gernes.length === 0) {
        throw new NotFoundException(`No genres found with the provided IDs`);
      }
      movie.gernes = gernes;
    }

    // Nếu có danh sách id_Version, thêm phiên bản vào bộ phim
    if (movieDto.id_Version) {
      const versions = await this.versionRepository.find({
        where: { id: In(movieDto.id_Version) },
        select: ['id', 'name'], // Chỉ lấy id và name
      });
      if (versions.length === 0) {
        throw new NotFoundException(`No versions found with the provided IDs`);
      }
      movie.versions = versions;
    }

    const savedMovie = await this.movieRepository.save(movie);

    // Trả về dữ liệu đã gói gọn
    return {
      id: savedMovie.id,
      name: savedMovie.name,
      content: savedMovie.content,
      director: savedMovie.director,
      duration: savedMovie.duration,
      from_date: savedMovie.from_date,
      to_date: savedMovie.to_date,
      production_company: savedMovie.production_company,
      thumbnail: savedMovie.thumbnail,
      banner: savedMovie.banner,
      is_deleted: savedMovie.is_deleted,
      actors: savedMovie.actors
        ? savedMovie.actors.map((actor) => ({
            id: actor.id,
            name: actor.name,
          }))
        : [],
      gernes: savedMovie.gernes
        ? savedMovie.gernes.map((gerne) => ({
            id: gerne.id,
            genre_name: gerne.genre_name,
          }))
        : [],
      versions: savedMovie.versions
        ? savedMovie.versions.map((version) => ({
            id: version.id,
            name: version.name,
          }))
        : [],
    };
  }

  async updateMovie(id: number, movieDto: UpdateMovieDto): Promise<IMovie> {
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

    const updatedMovie = await this.movieRepository.save(existingMovie);

    // Trả về dữ liệu đã gói gọn
    return {
      id: updatedMovie.id,
      name: updatedMovie.name,
      content: updatedMovie.content,
      director: updatedMovie.director,
      duration: updatedMovie.duration,
      from_date: updatedMovie.from_date,
      to_date: updatedMovie.to_date,
      production_company: updatedMovie.production_company,
      thumbnail: updatedMovie.thumbnail,
      is_deleted: updatedMovie.is_deleted,
      banner: updatedMovie.banner,
      actors: updatedMovie.actors.map((actor) => ({
        id: actor.id,
        name: actor.name,
      })),
      gernes: updatedMovie.gernes.map((gerne) => ({
        id: gerne.id,
        genre_name: gerne.genre_name,
      })),
      versions: updatedMovie.versions.map((version) => ({
        id: version.id,
        name: version.name,
      })),
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

  async addActorToMovie(
    movieId: number,
    actorId: number,
  ): Promise<{ id: number; name: string }> {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['actors'],
    });
    const actor = await this.actorRepository.findOne({
      where: { id: actorId },
    });

    if (!movie || !actor) {
      throw new NotFoundException('Movie or Actor not found');
    }

    movie.actors.push(actor);
    await this.movieRepository.save(movie);

    // Chỉ trả về `id` và `name` của Actor vừa thêm
    return { id: actor.id, name: actor.name };
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

  async addGerneToMovie(movieId: number, gerneId: number): Promise<Movie> {
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

    // Kiểm tra nếu thể loại đã tồn tại trong danh sách của phim
    const isGerneAlreadyAdded = movie.gernes.some(
      (existingGerne) => existingGerne.id === gerneId,
    );
    if (isGerneAlreadyAdded) {
      throw new BadRequestException(
        `Gerne with ID ${gerneId} is already added to the movie.`,
      );
    }

    // Thêm thể loại vào danh sách
    movie.gernes.push(gerne);
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
  async addVersionToMovie(movieId: number, versionId: number): Promise<Movie> {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['versions'], // Lấy danh sách phiên bản liên quan
    });

    const version = await this.versionRepository.findOne({
      where: { id: versionId },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }

    if (!version) {
      throw new NotFoundException(`Version with ID ${versionId} not found`);
    }

    // Kiểm tra nếu phiên bản đã tồn tại trong danh sách của phim
    const isVersionAlreadyAdded = movie.versions.some(
      (existingVersion) => existingVersion.id === versionId,
    );
    if (isVersionAlreadyAdded) {
      throw new BadRequestException(
        `Version with ID ${versionId} is already added to the movie.`,
      );
    }

    // Thêm phiên bản vào danh sách
    movie.versions.push(version);
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

  async removeVersionFromMovie(
    movieId: number,
    versionId: number,
  ): Promise<Movie> {
    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['versions'], // Lấy danh sách phiên bản liên quan
    });

    const version = await this.versionRepository.findOne({
      where: { id: versionId },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }

    if (!version) {
      throw new NotFoundException(`Version with ID ${versionId} not found`);
    }

    // Kiểm tra nếu phiên bản không tồn tại trong danh sách của phim
    const isVersionInMovie = movie.versions.some(
      (existingVersion) => existingVersion.id === versionId,
    );
    if (!isVersionInMovie) {
      throw new BadRequestException(
        `Version with ID ${versionId} is not associated with the movie.`,
      );
    }

    // Xóa phiên bản khỏi danh sách
    movie.versions = movie.versions.filter(
      (existingVersion) => existingVersion.id !== versionId,
    );
    return await this.movieRepository.save(movie);
  }
}
