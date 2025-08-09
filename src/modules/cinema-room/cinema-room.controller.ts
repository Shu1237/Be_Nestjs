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
import { CinemaRoomPaginationDto } from 'src/common/pagination/dto/cinmeroom/cinmearoomPagiantion.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('cinema-rooms')
export class CinemaRoomController {
  constructor(private readonly cinemaRoomService: CinemaRoomService) { }

  // GET - get list of cinema rooms for user
  @Get('user')
  @ApiOperation({ summary: 'Get all cinema rooms for users' })
  async getAllCinemaRoomsUser() {
    return await this.cinemaRoomService.getAllCinemaRoomsUser();
  }

  // GET - get list of cinema rooms for admin (with pagination)
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
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @UseGuards(RolesGuard)
  @ApiQuery({ name: 'is_deleted', required: false, type: Boolean, example: false })
  async findAll(@Query() query: CinemaRoomPaginationDto, @Req() req) {
    const { page = 1, take = 10, ...restFilters } = query;
    return this.cinemaRoomService.findAll({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - get cinema room by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get cinema room by ID' })
  async findOne(@Param('id') id: number) {
    return await this.cinemaRoomService.findOne(id);
  }

  // POST - Create a new cinema room
  @Post()
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new cinema room (admin, employee only)' })
  async create(@Body() createCinemaRoomDto: CreateCinemaRoomDto, @Req() req) {
    return await this.cinemaRoomService.create(createCinemaRoomDto);
  }

  // PUT - Update cinema room by ID
  @Put(':id')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update cinema room by ID (admin, employee only)' })
  async update(
    @Param('id') id: number,
    @Body() updateCinemaRoomDto: UpdateCinemaRoomDto,
  ) {
    return await this.cinemaRoomService.update(id, updateCinemaRoomDto);
  }

  // PATCH - Soft delete cinema room
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @UseGuards(RolesGuard)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a cinema room (admin, employee only)' })
  async softDeleteCinemaRoom(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.cinemaRoomService.softDeleteCinemaRoom(id);
  }

  // PATCH - Restore soft-deleted cinema room
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @UseGuards(RolesGuard)
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted cinema room (admin, employee only)',
  })
  async restoreCinemaRoom(@Param('id', ParseIntPipe) id: number) {
    return await this.cinemaRoomService.restoreCinemaRoom(id);
  }

  // DELETE - Delete cinema room by ID
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @UseGuards(RolesGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete cinema room by ID (admin, employee only)' })
  async remove(@Param('id') id: number) {
    return await this.cinemaRoomService.remove(id);
  }
}

