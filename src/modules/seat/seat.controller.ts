import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Req,
  Patch,
  Query,
} from '@nestjs/common';
import {  ApiBearerAuth, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { SeatService } from './seat.service';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { BulkCreateSeatDto } from './dto/BulkCreateSeatDto';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';
import { SeatPaginationDto } from 'src/common/pagination/dto/seat/seatPagination.dto';


@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('seat')
export class SeatController {
  constructor(private readonly seatService: SeatService) { }
  
  // GET - Lấy danh sách seats cho user
  @Get('user')
  @ApiOperation({ summary: 'Get all seats for users' })
  async getAllSeatsUser() {
    return await this.seatService.getAllSeatsUser();
  }

  // GET - Lấy danh sách seats cho admin (với phân trang)
  @Get('admin')
  @ApiOperation({ summary: 'Get all seats for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'cinema_room_id', required: false, type: String, example: 'room-uuid' })
  @ApiQuery({ name: 'seat_type_id', required: false, type: String, example: 'type-uuid' })
  @ApiQuery({ name: 'seat_row', required: false, type: String, example: 'A' })
  @ApiQuery({ name: 'seat_column', required: false, type: String, example: '5' })
  @ApiQuery({ name: 'is_deleted', required: false, type: Boolean, example: false })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'seat.seat_row' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], example: 'ASC' })
  getAllSeats(@Query() query: SeatPaginationDto, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can access this endpoint.');
    const {
      page = 1,
      take = 10,
      ...restFilters
    } = query;

    return this.seatService.getAllSeats({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - Lấy seats theo room ID
  @Get('room/:roomId')
  @ApiOperation({ summary: 'Get seats by room ID' })
  getSeatsByRoom(@Param('roomId') roomId: string) {
    return this.seatService.getSeatsByRoom(roomId);
  }

  // GET - Lấy seat theo ID
  @Get(':id')
  @ApiOperation({ summary: 'Get seat by ID' })
  getSeatById(@Param('id') id: string) {
    return this.seatService.getSeatById(id);
  }

  // POST - Tạo seat mới
  @Post()
  @ApiOperation({ summary: 'Create new seat (admin only)' })
  @ApiBody({ type: CreateSeatDto })
  createSeat(@Body() createSeatDto: CreateSeatDto, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Only admin can create seats');
    return this.seatService.createSeat(createSeatDto);
  }

  // POST - Tạo seats theo bulk
  @Post('bulk')
  @ApiOperation({ summary: 'Create Seat By Row & Col' })
  createSeatsBulk(@Body() dto: BulkCreateSeatDto) {
    return this.seatService.createSeatsBulk(dto);
  }

  // PUT - Cập nhật seat theo ID
  @Put(':id')
  @ApiOperation({ summary: 'Update seat by ID (admin only)' })
  @ApiBody({ type: UpdateSeatDto })
  updateSeat(
    @Param('id') id: string,
    @Body() updateSeatDto: UpdateSeatDto,
    @Req() req,
  ) {
    checkAdminEmployeeRole(req.user, 'Only admin can update seats');
    return this.seatService.updateSeat(id, updateSeatDto);
  }

  // PATCH - Soft delete seat
  @Patch(':id')
  @ApiOperation({ summary: 'Soft delete seat by ID (admin only)' })
  deleteSeat(@Param('id') id: string, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Only admin can delete seats');
    return this.seatService.deleteSeat(id);
  }

  // Commented out endpoints
  // @Patch('hold')
  // @ApiOperation({ summary: 'Hold seats' })
  // @ApiBody({ type: HoldSeatDto })
  // holdSeat(@Body() data: HoldSeatDto, @Req() req) {
  //   return this.seatService.holdSeat(data, req.user);
  // }

  // @Patch('cancel-hold')
  // @ApiOperation({ summary: 'Cancel hold seats' })
  // @ApiBody({ type: HoldSeatDto })
  // cancelHoldSeat(@Body() data: HoldSeatDto, @Req() req) {
  //   return this.seatService.cancelHoldSeat(data, req.user);
  // }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted seat by ID (admin only)' })
  restoreSeat(@Param('id') id: string, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Only admin can restore seats');
    return this.seatService.restoreSeat(id);
  }

  // @Put(':id/status')
  // @ApiOperation({ summary: 'Toggle seat status by ID (admin only)' })
  // updateSeatStatus(@Param('id') id: string, @Body() updateSeatStatusDto: UpdateSeatStatusDto, @Req() req) {
  //   const user = req.user as JWTUserType;
  //   if (user.role_id !== Role.ADMIN) {
  //     throw new Error('Only admin can update seat status');
  //   }
  //   return this.seatService.updateSeatStatus(id);
  // }
}
