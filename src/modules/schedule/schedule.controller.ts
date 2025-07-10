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
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';
import { SchedulePaginationDto } from 'src/common/pagination/dto/shedule/schedulePagination.dto';

@Controller('schedules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) { }

  // GET - Lấy danh sách schedules cho user
  @Get('user')
  @ApiOperation({ summary: 'Get all schedules for users' })
  async findAllUser() {
    return await this.scheduleService.findAllUser();
  }

  // GET - Lấy danh sách schedules cho admin (với phân trang)
  @Get('admin')
  @ApiOperation({ summary: 'Get all schedules for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'movieName', required: false, type: String, example: 'Avengers' })
  @ApiQuery({ name: 'cinemaRoomName', required: false, type: String, example: 'Phòng chiếu 1' })
  @ApiQuery({ name: 'scheduleStartTime', required: false, type: String, example: '2025-07-01' })
  @ApiQuery({ name: 'scheduleEndTime', required: false, type: String, example: '2025-07-31' })
  @ApiQuery({ name: 'version_id', required: false, type: Number, example: 2 })
  @ApiQuery({ name: 'is_deleted', required: false, type: Boolean, example: false })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'schedule.id' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], example: 'DESC' })
  async findAll(@Query() query: SchedulePaginationDto, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can access this endpoint.');
    const {
      page = 1,
      take = 10,
      ...restFilters
    } = query;
    return await this.scheduleService.findAll({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - Lấy schedule theo ID
  @Get(':id')
  @ApiOperation({ summary: 'Get schedule by ID' })
  async findOut(@Param('id') id: number) {
    return await this.scheduleService.findOut(id);
  }

  // POST - Tạo schedule mới
  @Post()
  @ApiOperation({ summary: 'Create a new schedule (admin, employee only)' })
  async create(@Body() createScheduleDto: CreateScheduleDto, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can create a schedule.');
    return await this.scheduleService.create(createScheduleDto);
  }

  // PUT - Cập nhật schedule theo ID
  @Put(':id')
  @ApiOperation({ summary: 'Update schedule by ID (admin, employee only)' })
  async update(
    @Param('id') id: number,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @Req() req,
  ) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can update a schedule.');
    return await this.scheduleService.update(id, updateScheduleDto);
  }

  // PATCH - Soft delete schedule
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a schedule (admin, employee only)' })
  async softDeleteSchedule(@Param('id', ParseIntPipe) id: number, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can soft delete a schedule.');
    return await this.scheduleService.softDeleteSchedule(id);
  }


  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted schedule (admin, employee only)' })
  async restoreSchedule(@Param('id', ParseIntPipe) id: number, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can restore a schedule.');
    return await this.scheduleService.restoreSchedule(id);
  }

  @UseGuards(JwtAuthGuard)

  @Delete(':id')
  @ApiOperation({ summary: 'Delete schedule by ID (admin, employee only)' })
  async remove(@Param('id') id: number, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can delete a schedule.');
    return await this.scheduleService.softDelete(id);
  }
}
