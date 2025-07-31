import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Put,
  Query,
} from '@nestjs/common';
import { GerneService } from './gerne.service';
import { Gerne } from 'src/database/entities/cinema/gerne';
import { CreateGerneDto } from './dtos/createGerne';
import { UpdateGerneDto } from './dtos/updateGerne';
import { ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { Movie } from 'src/database/entities/cinema/movie';
import { GernePaginationDto } from 'src/common/pagination/dto/gerne/gerne.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';


@Controller('gernes')
export class GerneController {
  constructor(private readonly gerneService: GerneService) { }

  // GET - Lấy danh sách genres cho user
  @Get('user')
  @ApiOperation({ summary: 'Get all genres for users' })
  async getAllGernesUser(): Promise<Gerne[]> {
    return await this.gerneService.getAllGernesUser();
  }

  // GET - Lấy danh sách genres cho admin (với phân trang)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('admin')
  @ApiOperation({ summary: 'Get all genres for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'Action',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  @ApiQuery({
    name: 'is_deleted',
    required: false,
    type: Boolean,
    example: false,
  })
  @ApiBearerAuth()
  async findAllGernes(@Query() query: GernePaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;

    return await this.gerneService.findAllGernes({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - Lấy genre theo ID
  @Get(':id')
  @ApiOperation({ summary: 'Get genre by ID' })
  async findGerneById(@Param('id', ParseIntPipe) id: number): Promise<Gerne> {
    return await this.gerneService.findGerneById(id);
  }

  // GET - Lấy movies của genre
  @Get(':gerneId/movies')
  @ApiOperation({ summary: 'Get all movies of a genre' })
  async getMoviesOfGerne(
    @Param('gerneId', ParseIntPipe) gerneId: number,
  ): Promise<Movie[]> {
    return await this.gerneService.getMoviesOfGerne(gerneId);
  }

  // POST - Tạo genre mới
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({ summary: 'Create a new genre (admin, employee only)' })
  @ApiBearerAuth()
  createGerne(@Body() createGerneDto: CreateGerneDto) {
    return this.gerneService.createGerne(createGerneDto);
  }

  // PUT - Cập nhật genre theo ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Put(':id')
  @ApiOperation({ summary: 'Update genre by ID (admin, employee only)' })
  @ApiBearerAuth()
  updateGerne(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGerneDto: UpdateGerneDto,
  ) {
    return this.gerneService.updateGerne(id, updateGerneDto);
  }

  // PATCH - Soft delete genre
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a genre (admin, employee only)' })
  @ApiBearerAuth()
  softDeleteGerne(@Param('id', ParseIntPipe) id: number) {
    return this.gerneService.softDeleteGerne(id);
  }

  // DELETE - Xóa genre vĩnh viễn
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted genre (admin, employee only)',
  })
  async restoreGerne(@Param('id', ParseIntPipe) id: number) {
    return await this.gerneService.restoreGerne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete genre by ID (admin only)' })
  @ApiBearerAuth()
  async deleteGerne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return await this.gerneService.deleteGerne(id);
  }
}
