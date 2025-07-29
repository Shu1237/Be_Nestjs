import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Put,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { CinemaRoomService } from './cinema-room.service';
import { CreateCinemaRoomDto } from './dto/create-cinema-room.dto';
import { UpdateCinemaRoomDto } from './dto/update-cinema-room.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';
import { CinemaRoomPaginationDto } from 'src/common/pagination/dto/cinmeroom/cinmearoomPagiantion.dto';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('cinema-rooms')
export class CinemaRoomController {
  constructor(private readonly cinemaRoomService: CinemaRoomService) {}

  // GET - Lấy danh sách cinema rooms cho user
  @Get('user')
  @ApiOperation({ summary: 'Get all cinema rooms for users' })
  async getAllCinemaRoomsUser() {
    return await this.cinemaRoomService.getAllCinemaRoomsUser();
  }

  // GET - Lấy danh sách cinema rooms cho admin (với phân trang)
  @Get('admin')
  @ApiOperation({ summary: 'Get all cinema rooms for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'Room 1',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  async findAll(@Query() query: CinemaRoomPaginationDto, @Req() req) {
    checkAdminEmployeeRole(
      req.user,
      'Unauthorized: Only admin or employee can access this endpoint.',
    );
    const { page = 1, take = 10, ...restFilters } = query;
    return this.cinemaRoomService.findAll({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - Lấy cinema room theo ID
  @Get(':id')
  @ApiOperation({ summary: 'Get cinema room by ID' })
  async findOne(@Param('id') id: number) {
    return await this.cinemaRoomService.findOne(id);
  }

  // POST - Tạo cinema room mới
  @Post()
  @ApiOperation({ summary: 'Create a new cinema room (admin, employee only)' })
  async create(@Body() createCinemaRoomDto: CreateCinemaRoomDto, @Req() req) {
    checkAdminEmployeeRole(
      req.user,
      'Unauthorized: Only admin or employee can create a cinema room.',
    );
    return await this.cinemaRoomService.create(createCinemaRoomDto);
  }

  // PUT - Cập nhật cinema room theo ID
  @Put(':id')
  @ApiOperation({ summary: 'Update cinema room by ID (admin, employee only)' })
  async update(
    @Param('id') id: number,
    @Body() updateCinemaRoomDto: UpdateCinemaRoomDto,
    @Req() req,
  ) {
    checkAdminEmployeeRole(
      req.user,
      'Unauthorized: Only admin or employee can update a cinema room.',
    );
    return await this.cinemaRoomService.update(id, updateCinemaRoomDto);
  }

  // PATCH - Soft delete cinema room
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a cinema room (admin, employee only)' })
  async softDeleteCinemaRoom(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ) {
    checkAdminEmployeeRole(
      req.user,
      'Unauthorized: Only admin or employee can soft delete a cinema room.',
    );
    return await this.cinemaRoomService.softDeleteCinemaRoom(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted cinema room (admin, employee only)',
  })
  async restoreCinemaRoom(@Param('id', ParseIntPipe) id: number, @Req() req) {
    checkAdminEmployeeRole(
      req.user,
      'Unauthorized: Only admin or employee can restore a cinema room.',
    );
    return await this.cinemaRoomService.restoreCinemaRoom(id);
  }

  @UseGuards(JwtAuthGuard)

  // DELETE - Xóa cinema room theo ID
  @Delete(':id')
  @ApiOperation({ summary: 'Delete cinema room by ID (admin, employee only)' })
  async remove(@Param('id') id: number, @Req() req) {
    checkAdminEmployeeRole(
      req.user,
      'Unauthorized: Only admin or employee can delete a cinema room.',
    );
    return await this.cinemaRoomService.remove(id);
  }
}
