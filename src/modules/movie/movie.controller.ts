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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dtos/createMovie.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { UpdateMovieDto } from './dtos/updateMovie.dto';
import { MoviePaginationDto } from 'src/common/pagination/dto/movie/moviePagination.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';

@ApiBearerAuth()
@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) { }

  // GET - get all movies for user
  @Get('user')
  @ApiOperation({ summary: 'Get all movies for user' })
  getMovie() {
    return this.movieService.getAllMoviesUser();
  }

  // GET - get all movies for admin (with pagination)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('admin')
  @ApiOperation({ summary: 'Get all movies for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'Avengers',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'movie.name',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    example: '2025-07-01',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    type: String,
    example: '2025-07-31',
  })
  @ApiQuery({ name: 'nation', required: false, type: String, example: 'USA' })
  @ApiQuery({
    name: 'director',
    required: false,
    type: String,
    example: 'Christopher Nolan',
  })
  @ApiQuery({
    name: 'is_deleted',
    required: false,
    type: Boolean,
    example: false,
  })
  @ApiQuery({ name: 'actor_id', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'gerne_id', required: false, type: Number, example: 2 })
  @ApiQuery({ name: 'version_id', required: false, type: Number, example: 3 })
  getAllMovies(@Query() query: MoviePaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;
    return this.movieService.getAllMovies({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - get movie by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get movie by ID' })
  getMovieById(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.getMovieById(id);
  }

  // GET - get all genres of a movie
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get(':movieId/gernes')
  @ApiOperation({ summary: 'Get all genres of a movie' })
  getGernesOfMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
  ) {
    return this.movieService.getGernesOfMovie(movieId);
  }

  // POST - Create new movie
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({ summary: 'Create a new movie' })
  async createMovie(@Body() movieDto: CreateMovieDto) {
    return this.movieService.createMovie(movieDto);
  }

  // PUT - Update movie by ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Put(':id')
  @ApiOperation({ summary: 'Update movie by ID (admin, employee only)' })
  async updateMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() movieDTO: UpdateMovieDto,
  ){
    return this.movieService.updateMovie(id, movieDTO);
  }

  // PATCH - Soft delete movie by ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id')
  @ApiOperation({ summary: 'Soft delete a movie by ID (admin, employee only)' })
  async softDeleteMovie(@Param('id', ParseIntPipe) id: number) {
    await this.movieService.softDeleteMovie(id);
    return { message: 'Movie soft deleted successfully' };
  }

  // PATCH - Restore soft-deleted movie by ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted movie by ID (admin, employee only)',
  })
  async restoreMovie(@Param('id', ParseIntPipe) id: number) {
    return await this.movieService.restoreMovie(id);
  }

  // DELETE - Hard delete movie by ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Delete(':id')
  @ApiOperation({ summary: 'Hard delete a movie by ID (admin, employee only)' })
  async deleteMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.deleteMovie(id);
  }
}
