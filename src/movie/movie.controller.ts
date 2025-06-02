import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  UseGuards,
  Patch,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

import { MovieService } from './movie.service';
import { MovieDTO } from './dtos/movie.dto';
import { Movie } from 'src/typeorm/entities/cinema/movie';

import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { Role } from 'src/enum/roles.enum';
import { JWTUserType } from 'src/utils/type';

@ApiTags('Movies')
@ApiBearerAuth() 
@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new movie' })
  @ApiResponse({ status: 201, description: 'Movie created successfully.', type: Movie })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiBody({ type: MovieDTO })
  createMovie(@Body() movieDto: MovieDTO,@Req() req) {
    const user = req.user as JWTUserType;
    if(user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) { 
      return {
        statusCode: 403,
        message: 'Unauthorized: Only admin or employee can create a movie.',
      }
    }
    return this.movieService.createMovie(movieDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all movies' })
  @ApiResponse({ status: 200, description: 'List of movies.', type: [Movie] })
  getAllMovies(): Promise<Movie[]> {
    return this.movieService.getAllMovies();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get movie by ID' })
  @ApiResponse({ status: 200, description: 'Movie found.', type: Movie })
  @ApiResponse({ status: 404, description: 'Movie not found.' })
  getMovieById(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.getMovieById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update movie by ID (admin, employee only)' })
  @ApiResponse({ status: 200, description: 'Movie updated successfully.', type: Movie })
  @ApiResponse({ status: 404, description: 'Movie not found.' })
  @ApiBody({ type: MovieDTO })
  updateMovie( @Param('id', ParseIntPipe) id: number, @Body() movieDto: MovieDTO,@Req() req) {
   const user = req.user as JWTUserType;
    if(user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) { 
        return {
        statusCode: 403,
        message: 'Unauthorized: Only admin or employee can update a movie.',
      }
    }
    return this.movieService.updateMovie(id, movieDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Hard delete a movie by ID (admin, employee only)' })
  @ApiResponse({ status: 200, description: 'Movie deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Movie not found.' })
  deleteMovie(@Param('id', ParseIntPipe) id: number, @Req() req) {
     const user = req.user as JWTUserType;
    if(user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) { 
       return {
        statusCode: 403,
        message: 'Unauthorized: Only admin or employee can delete a movie.',
      }
    }
    return this.movieService.deleteMovie(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Soft delete a movie by ID (admin, employee only)' })
  @ApiResponse({ status: 200, description: 'Movie soft-deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Movie not found.' })
  softDeleteMovie(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user as JWTUserType;
    if(user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) { 
        return {
        statusCode: 403,
        message: 'Unauthorized: Only admin or employee can soft delete a movie.',
      }
    }
    return this.movieService.softDeleteMovie(id);
  }
}
