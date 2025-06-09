import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Req,
  ForbiddenException,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { SeatService } from './seat.service';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { UpdateSeatStatusDto } from './dto/update-seat-status.dto';
import { Request } from 'express';
import { JWTUserType } from 'src/utils/type';
import { Role } from 'src/enum/roles.enum';
import { HoldSeatDto } from './dto/hold-seat.dto';

@ApiTags('Seats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('seat')
export class SeatController {
  constructor(private readonly seatService: SeatService) {}

  @Get()
  @ApiOperation({ summary: 'Get all seats' })
  @ApiResponse({
    status: 200,
    description: 'List of all seats',
  })
  getAllSeats() {
    return this.seatService.getAllSeats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get seat by ID' })
  @ApiResponse({
    status: 200,
    description: 'Seat found',
  })
  @ApiResponse({
    status: 404,
    description: 'Seat not found',
  })
  getSeatById(@Param('id') id: string) {
    return this.seatService.getSeatById(id);
  }

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Get seats by room ID' })
  @ApiResponse({
    status: 200,
    description: 'List of seats in the room',
  })
  getSeatsByRoom(@Param('roomId') roomId: string) {
    return this.seatService.getSeatsByRoom(roomId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new seat (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Seat created successfully',
    example: { msg: 'Seat created successfully' },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin can create seats',
  })
  @ApiBody({ type: CreateSeatDto })
  createSeat(@Body() createSeatDto: CreateSeatDto, @Req() req: Request) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can create seats');
    }
    return this.seatService.createSeat(createSeatDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update seat by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Seat updated successfully',
    example: { msg: 'Seat updated successfully' },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin can update seats',
  })
  @ApiResponse({
    status: 404,
    description: 'Seat not found',
  })
  @ApiBody({ type: UpdateSeatDto })
  updateSeat(
    @Param('id') id: string,
    @Body() updateSeatDto: UpdateSeatDto,
    @Req() req: Request,
  ) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can update seats');
    }
    return this.seatService.updateSeat(id, updateSeatDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Soft delete seat by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Seat deleted successfully',
    example: { msg: 'Seat deleted successfully' },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin can delete seats',
  })
  @ApiResponse({
    status: 404,
    description: 'Seat not found',
  })
  async softDeleteSeat(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can delete seats');
    }
    return this.seatService.deleteSeat(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Toggle seat status by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Seat status toggled successfully',
    example: { msg: 'Change status successfully' },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin can update seat status',
  })
  @ApiResponse({
    status: 404,
    description: 'Seat not found',
  })
  updateSeatStatus(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can update seat status');
    }
    return this.seatService.updateSeatStatus(id);
  }

  @Post('hold')
  @ApiOperation({ summary: 'Hold seats' })
  @ApiResponse({
    status: 200,
    description: 'Seats held successfully',
    example: { msg: 'Seats held successfully' },
  })
  holdSeat(@Body() data: HoldSeatDto, @Req() req: Request) {
    return this.seatService.holdSeat(data, req);
  }

  @Post('cancel-hold')
  @ApiOperation({ summary: 'Cancel hold seats' })
  @ApiResponse({
    status: 200,
    description: 'Seats un-held successfully',
    example: { msg: 'Seats un-held successfully' },
  })
  cancelHoldSeat(@Body() data: HoldSeatDto, @Req() req: Request) {
    return this.seatService.cancelHoldSeat(data, req);
  }
}
