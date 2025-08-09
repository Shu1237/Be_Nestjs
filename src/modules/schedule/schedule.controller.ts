import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Put,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { SchedulePaginationDto } from 'src/common/pagination/dto/shedule/schedulePagination.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('schedules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) { }

  // GET - Get list of schedules for user
  @Get('user')
  @ApiOperation({ summary: 'Get all schedules for users' })
  async findAllUser() {
    return await this.scheduleService.findAllUser();
  }

  // GET - Get list of schedules for admin (with pagination)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('admin')
  @ApiOperation({ summary: 'Get all schedules for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'movieName',
    required: false,
    type: String,
    example: 'Avengers',
  })
  @ApiQuery({
    name: 'cinemaRoomName',
    required: false,
    type: String,
    example: 'Room 1',
  })
  @ApiQuery({
    name: 'scheduleStartTime',
    required: false,
    type: String,
    example: '2025-07-01',
  })
  @ApiQuery({
    name: 'scheduleEndTime',
    required: false,
    type: String,
    example: '2025-07-31',
  })
  @ApiQuery({ name: 'version_id', required: false, type: Number, example: 2 })
  @ApiQuery({
    name: 'is_deleted',
    required: false,
    type: Boolean,
    example: false,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'schedule.id',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  async findAll(@Query() query: SchedulePaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;
    return await this.scheduleService.findAll({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - Get schedule by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get schedule by ID' })
  async findOut(@Param('id') id: number) {
    return await this.scheduleService.findOut(id);
  }

  // POST - Create new schedule
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({ summary: 'Create a new schedule (admin, employee only)' })
  async create(@Body() createScheduleDto: CreateScheduleDto) {
    return await this.scheduleService.create(createScheduleDto);
  }

  // PUT - Update schedule by ID
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Put(':id')
  @ApiOperation({ summary: 'Update schedule by ID (admin, employee only)' })
  async update(
    @Param('id') id: number,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return await this.scheduleService.update(id, updateScheduleDto);
  }

  // PATCH - Soft delete schedule
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a schedule (admin, employee only)' })
  async softDeleteSchedule(@Param('id', ParseIntPipe) id: number) {
    return await this.scheduleService.softDeleteSchedule(id);
  }
  
  // PATCH - Restore soft-deleted schedule
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted schedule (admin, employee only)',
  })
  async restoreSchedule(@Param('id', ParseIntPipe) id: number) {
    return await this.scheduleService.restoreSchedule(id);
  }
 
  // DELETE - Permanently delete schedule by ID
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete schedule by ID (admin, employee only)' })
  async remove(@Param('id') id: number) {
    return await this.scheduleService.softDelete(id);
  }
}
