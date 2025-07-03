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

@ApiTags('Movies')
@ApiBearerAuth()
@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new movie' })
  async createMovie(@Body() movieDto: CreateMovieDto, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can create a movie.');
    return this.movieService.createMovie(movieDto);
  }

  // @Get()
  // @ApiOperation({ summary: 'Get all movies' })
  // getAllMovies(): Promise<any> {
  //   return this.movieService.getAllMovies();
  // }

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
  @Get()
  @ApiOperation({ summary: 'Get all movies (with pagination or all)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAllMoviesPaginated(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<any> {
    if (!page && !limit) {
      // Không truyền page, limit => trả về toàn bộ
      return this.movieService.getAllMovies();
    }
    // Có page, limit => phân trang
    return this.movieService.getMoviesPaginated(
      Number(page) || 1,
      Number(limit) || 10,
    );
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
