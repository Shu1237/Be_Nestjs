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
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

import { MovieService } from './movie.service';
import { CreateMovieDto } from './dtos/createMovie.dto';
import { Movie } from 'src/typeorm/entities/cinema/movie';

import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { Role } from 'src/enum/roles.enum';
import { IMovie, JWTUserType } from 'src/utils/type';
import { Gerne } from 'src/typeorm/entities/cinema/gerne';
import { UpdateMovieDto } from './dtos/updateMovie.dto';
import { ResponseUtil } from 'src/common/response.util';

@ApiTags('Movies')
@ApiBearerAuth()
@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new movie' })
  async createMovie(@Body() movieDto: CreateMovieDto, @Req() req) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin or employee can create a movie.',
      );
    }
    return this.movieService.createMovie(movieDto);
     
  }

  @Get()
  @ApiOperation({ summary: 'Get all movies' })
  getAllMovies(): Promise<any> {
    return this.movieService.getAllMovies();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get movie by ID' })
  getMovieById(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.getMovieById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update movie by ID (admin, employee only)' })
  async updateMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() movieDTO: UpdateMovieDto,
    @Req() req,
  ): Promise<any> {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin or employee can update a movie.',
      );
    }
    return this.movieService.updateMovie(id, movieDTO);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Hard delete a movie by ID (admin, employee only)' })
  async deleteMovie(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      return ResponseUtil.error(
        'Unauthorized: Only admin or employee can delete a movie.',
        403,
      );
    }
    return this.movieService.deleteMovie(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Soft delete a movie by ID (admin, employee only)' })
  async softDeleteMovie(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      return ResponseUtil.error(
        'Unauthorized: Only admin or employee can soft delete a movie.',
        403,
      );
    }
    await this.movieService.softDeleteMovie(id);
    return ResponseUtil.success('Movie soft deleted successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Get(':movieId/actors')
  @ApiOperation({ summary: 'Get all actors of a movie' })
  getActorsOfMovie(@Param('movieId', ParseIntPipe) movieId: number) {
    return this.movieService.getActorsOfMovie(movieId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':movieId/gernes')
  @ApiOperation({ summary: 'Get all genres of a movie' })
  getGernesOfMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
  ): Promise<any> {
    return this.movieService.getGernesOfMovie(movieId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':movieId/versions')
  @ApiOperation({ summary: 'Get all versions of a movie' })
  getVersionsOfMovie(@Param('movieId', ParseIntPipe) movieId: number) {
    return this.movieService.getVersionsOfMovie(movieId);
  }
}
