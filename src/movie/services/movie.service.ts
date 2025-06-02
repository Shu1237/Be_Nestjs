import { Injectable, NotFoundException } from '@nestjs/common';
import { MovieDTO } from '../dtos/movie.dto';
import { Movie } from 'src/typeorm/entities/cinema/movie';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@ApiTags('Movies') // Gắn tag cho nhóm API
@Injectable()
export class MovieService {
  constructor(
  @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>, ) {}

  @ApiOperation({ summary: 'Create a new movie' })
  @ApiResponse({ status: 201, description: 'Movie created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async createMovie(movieDto: MovieDTO): Promise<Movie> {
    const movie = this.movieRepository.create(movieDto);
    return await this.movieRepository.save(movie);
  }

  @ApiOperation({ summary: 'Get all movies' })
  @ApiResponse({ status: 200, description: 'List of movies retrieved successfully.' })
  async getAllMovies(): Promise<Movie[]> {
    return await this.movieRepository.find();
  }

  @ApiOperation({ summary: 'Get a movie by ID' })
  @ApiResponse({ status: 200, description: 'Movie retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Movie not found.' })
  async getMovieById(id: number): Promise<Movie> {
    const movie = await this.movieRepository.findOneBy({ id });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  @ApiOperation({ summary: 'Update a movie by ID' })
  @ApiResponse({ status: 200, description: 'Movie updated successfully.' })
  @ApiResponse({ status: 404, description: 'Movie not found.' })
  async updateMovie(id: number, movieDTO: MovieDTO): Promise<Movie> {
    await this.getMovieById(id); // check existence
    await this.movieRepository.update(id, movieDTO);
    return this.getMovieById(id);
  }

  @ApiOperation({ summary: 'Delete a movie by ID' })
  @ApiResponse({ status: 200, description: 'Movie deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Movie not found.' })
  async deleteMovie(id: number): Promise<void> {
    const result = await this.movieRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
  }

  @ApiOperation({ summary: 'Delete a movie by ID' })
  @ApiResponse({ status: 200, description: 'Movie deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Movie not found.' })
   async softDeleteMovie(id: number): Promise<void> {
    const movie = await this.getMovieById(id); // Kiểm tra xem phim có tồn tại không
    movie.is_deleted = true; // Đánh dấu là đã xóa
    await this.movieRepository.save(movie);
  }
}