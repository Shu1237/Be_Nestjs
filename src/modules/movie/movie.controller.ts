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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dtos/createMovie.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { UpdateMovieDto } from './dtos/updateMovie.dto';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';
import { MoviePaginationDto } from 'src/common/pagination/dto/movie/moviePagination.dto';

@ApiTags('Movies')
@ApiBearerAuth()
@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new movie' })
  async createMovie(@Body() movieDto: CreateMovieDto, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can create a movie.');
    return this.movieService.createMovie(movieDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all movies' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Avengers' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'movie.name' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], example: 'DESC' })
  @ApiQuery({ name: 'fromDate', required: false, type: String, example: '2025-07-01' })
  @ApiQuery({ name: 'toDate', required: false, type: String, example: '2025-07-31' })
  @ApiQuery({ name: 'nation', required: false, type: String, example: 'USA' })
  @ApiQuery({ name: 'director', required: false, type: String, example: 'Christopher Nolan' })
  @ApiQuery({ name: 'is_deleted', required: false, type: Boolean, example: false })
  @ApiQuery({ name: 'actor_id', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'gerne_id', required: false, type: Number, example: 2 })
  @ApiQuery({ name: 'version_id', required: false, type: Number, example: 3 })
  @ApiOperation({ summary: 'Get all movies' })
  getAllMovies(@Query() query: MoviePaginationDto, @Req() req) {
    // checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can view all movies.');
    const {
      page = 1,
      take = 10,
      ...restFilters
    } = query;
    return this.movieService.getAllMovies({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
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
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can update a movie.');
    return this.movieService.updateMovie(id, movieDTO);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Hard delete a movie by ID (admin, employee only)' })
  async deleteMovie(@Param('id', ParseIntPipe) id: number, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can delete a movie.');
    return this.movieService.deleteMovie(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Soft delete a movie by ID (admin, employee only)' })
  async softDeleteMovie(@Param('id', ParseIntPipe) id: number, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can soft delete a movie.');
    await this.movieService.softDeleteMovie(id);
    return { message: 'Movie soft deleted successfully' };
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
