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
  Req,
  Put,
  Query,
} from '@nestjs/common';
import { GerneService } from './gerne.service';
import { Gerne } from 'src/database/entities/cinema/gerne';
import { CreateGerneDto } from './dtos/createGerne';
import { UpdateGerneDto } from './dtos/updateGerne';
import {
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { Movie } from 'src/database/entities/cinema/movie';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';
import { GernePaginationDto } from 'src/common/pagination/dto/gerne/gerne.dto';


@ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard)
  @Get('admin')
  @ApiOperation({ summary: 'Get all genres for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Action' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], example: 'ASC' })
  async findAllGernes(@Query() query: GernePaginationDto, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can access this endpoint.');
    const {
      page = 1,
      take = 10,
      ...restFilters
    } = query;

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
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new genre (admin, employee only)' })
  createGerne(@Body() createGerneDto: CreateGerneDto, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can create a genre.');
    return this.gerneService.createGerne(createGerneDto);
  }



  // PUT - Cập nhật genre theo ID
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update genre by ID (admin, employee only)' })
  updateGerne(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGerneDto: UpdateGerneDto,
    @Req() req,
  ) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can update a genre.');
    return this.gerneService.updateGerne(id, updateGerneDto);
  }



  // PATCH - Soft delete genre
  @UseGuards(JwtAuthGuard)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a genre (admin, employee only)' })
  softDeleteGerne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can soft delete a genre.');
    return this.gerneService.softDeleteGerne(id);
  }



  // DELETE - Xóa genre vĩnh viễn
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete genre by ID (admin only)' })
  async deleteGerne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ): Promise<void> {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin can delete a genre.');
    return await this.gerneService.deleteGerne(id);
  }
}
