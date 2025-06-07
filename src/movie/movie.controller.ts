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
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

import { MovieService } from './movie.service';
import { CreateMovieDto } from './dtos/createMovie.dto';
import { Movie } from 'src/typeorm/entities/cinema/movie';

import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { Role } from 'src/enum/roles.enum';
import { IMovie, JWTUserType } from 'src/utils/type';
import { Gerne } from 'src/typeorm/entities/cinema/gerne';
import { UpdateMovieDto } from './dtos/updateMovie.dto';

@ApiTags('Movies')
@ApiBearerAuth()
@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new movie' })
  @ApiResponse({
    status: 201,
    description: 'Movie created successfully.',
    type: Movie,
  })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiBody({ type: CreateMovieDto })
  async createMovie(
    @Body() movieDto: CreateMovieDto,
    @Req() req,
  ): Promise<IMovie> {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin or employee can create a movie.',
      );
    }
    return await this.movieService.createMovie(movieDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all movies' })
  @ApiResponse({ status: 200, description: 'List of movies.', type: [Movie] })
  getAllMovies(): Promise<IMovie[]> {
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
  @ApiResponse({
    status: 200,
    description: 'Movie updated successfully.',
    type: Movie,
  })

  @ApiResponse({ status: 404, description: 'Movie not found.' })
  async updateMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() movieDTO: UpdateMovieDto,
    @Req() req,
  ): Promise<IMovie> {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin or employee can update a movie.',
      );
    }
    return await this.movieService.updateMovie(id, movieDTO);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Hard delete a movie by ID (admin, employee only)' })
  @ApiResponse({ status: 200, description: 'Movie deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Movie not found.' })
  deleteMovie(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      return {
        statusCode: 403,
        message: 'Unauthorized: Only admin or employee can delete a movie.',
      };
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
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      return {
        statusCode: 403,
        message:
          'Unauthorized: Only admin or employee can soft delete a movie.',
      };
    }
    return this.movieService.softDeleteMovie(id);
  }


  @UseGuards(JwtAuthGuard)
  @Get(':movieId/actors')
  @ApiOperation({ summary: 'Get all actors of a movie' })
  async getActorsOfMovie(@Param('movieId', ParseIntPipe) movieId: number) {
    return await this.movieService.getActorsOfMovie(movieId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':movieId/gernes')
  @ApiOperation({ summary: 'Get all genres of a movie' })
  @ApiResponse({ status: 200, description: 'List of genres.', type: [Gerne] })
  async getGernesOfMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
  ): Promise<Gerne[]> {
    return await this.movieService.getGernesOfMovie(movieId);
  }


  @UseGuards(JwtAuthGuard)
  @Get(':movieId/versions')
  @ApiOperation({ summary: 'Get all versions of a movie' })
  async getVersionsOfMovie(@Param('movieId', ParseIntPipe) movieId: number) {
    return await this.movieService.getVersionsOfMovie(movieId);
  }

  // @UseGuards(JwtAuthGuard)
  // @Patch(':movieId/remove-version/:versionId')
  // @ApiOperation({ summary: 'Remove a version from a movie' })
  // async removeVersionFromMovie(
  //   @Param('movieId', ParseIntPipe) movieId: number,
  //   @Param('versionId', ParseIntPipe) versionId: number,
  //   @Req() req,
  // ) {
  //   const user = req.user as JWTUserType;
  //   if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
  //     throw new ForbiddenException(
  //       'Unauthorized: Only admin or employee can remove a version from a movie.',
  //     );
  //   }
  //   return await this.movieService.removeVersionFromMovie(movieId, versionId);
  // }
}
