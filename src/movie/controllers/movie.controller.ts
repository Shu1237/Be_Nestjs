import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, UseGuards, Patch } from '@nestjs/common';
import { MovieService } from '../services/movie.service';
import { MovieDTO } from '../dtos/movie.dto';
import { Movie } from 'src/typeorm/entities/cinema/movie';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from 'src/guards/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { JwtAuthGuard } from 'src/guards/auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Movies')
@ApiBearerAuth()
@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Post()
  createMovie(@Body() movieDto: MovieDTO): Promise<Movie> {
    return this.movieService.createMovie(movieDto);
  }

  @Get()
  getAllMovies(): Promise<Movie[]> {
    return this.movieService.getAllMovies();
  }

  @Get(':id')
  getMovieById(@Param('id', ParseIntPipe) id: number): Promise<Movie> {
    return this.movieService.getMovieById(id);
  }

  @Roles('admin', 'employee') 
  @Put(':id')
  updateMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() movieDto: MovieDTO,
  ): Promise<Movie> {
    return this.movieService.updateMovie(id, movieDto);
  }

  @Roles('admin', 'employee')
  @Delete(':id')
  deleteMovie(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.movieService.deleteMovie(id);
  }
  @Roles('admin', 'employee')
  @Patch(':id')
  softDeleteMovie(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.movieService.softDeleteMovie(id);
  }

}