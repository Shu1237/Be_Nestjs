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
  Delete,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { SeatService } from './seat.service';
import { BulkCreateSeatDto } from './dto/BulkCreateSeatDto';
import { SeatPaginationDto } from 'src/common/pagination/dto/seat/seatPagination.dto';
import { BulkSeatOperationDto } from './dto/BulkSeatOperationDto';
import { BulkSeatIdsDto } from './dto/BulkSeatIdsDto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';

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
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('admin')
  @ApiOperation({ summary: 'Get all seats for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'cinema_room_id',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'seat_type_id',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({ name: 'seat_row', required: false, type: String, example: 'A' })
  @ApiQuery({
    name: 'seat_column',
    required: false,
    type: String,
    example: '5',
  })
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
    example: 'seat.seat_row',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  getAllSeats(@Query() query: SeatPaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;
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
  // POST - Tạo seats theo bulk
  @Post('bulk')
  @ApiOperation({ summary: 'Create Seat By Row & Col' })
  createSeatsBulk(@Body() dto: BulkCreateSeatDto) {
    return this.seatService.createSeatsBulk(dto);
  }

  // PUT - Bulk update multiple seats (PUT THIS BEFORE DYNAMIC ROUTES)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put('bulk-update')
  @ApiOperation({ summary: 'Bulk update multiple seats (admin only)' })
  @ApiBody({ type: BulkSeatOperationDto })
  async bulkUpdateSeats(
    @Body(new ValidationPipe({ whitelist: true })) dto: BulkSeatOperationDto) {
    return this.seatService.bulkUpdateSeats(dto);
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('bulk-delete')
  @ApiOperation({ summary: 'Bulk soft delete multiple seats (admin only)' })
  @ApiBody({ type: BulkSeatIdsDto })
  async bulkDeleteSeats(
    @Body(new ValidationPipe({ whitelist: true })) dto: BulkSeatIdsDto) {
    return this.seatService.bulkDeleteSeats(dto);
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
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted seat by ID (admin only)' })
  restoreSeat(@Param('id') id: string) {
    return this.seatService.restoreSeat(id);
  }
}
