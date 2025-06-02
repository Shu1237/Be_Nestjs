import { Injectable, NotFoundException } from '@nestjs/common';

import { Movie } from 'src/typeorm/entities/cinema/movie';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IMovie } from 'src/utils/type';

@ApiTags('Movies')
@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) { }


  async createMovie(movieDto: IMovie) {
    const existingMovie = await this.movieRepository.findOneBy({ name: movieDto.name });
    if (existingMovie) {
      throw new NotFoundException(`Movie with name ${movieDto.name} already exists`);
    }
    const movie = this.movieRepository.create(movieDto);
    await this.movieRepository.save(movie);
    return {
      msg: 'Movie created successfully',
      movie: movie,
    };
  }
  async getAllMovies() {
    return await this.movieRepository.find();
  }


  async getMovieById(id: number) {
    const movie = await this.movieRepository.findOneBy({ id });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }


  async updateMovie(id: number, movieDTO: IMovie) {
    const existingMovie = await this.getMovieById(id);
    if (!existingMovie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    await this.movieRepository.update(id, movieDTO); 
    const updatedMovie = await this.getMovieById(id); 

    return {
      msg: 'Movie updated successfully',
      movie: updatedMovie,
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
}