import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,

  UseGuards,
  Req,
  ForbiddenException,
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
import { Request } from 'express';
import { JWTUserType } from 'src/utils/type';
import { Role } from 'src/enum/roles.enum';
import { HoldSeatDto } from './dto/hold-seat.dto';

interface RequestWithUser extends Request {
  user: JWTUserType;
}

@ApiTags('Seats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('seats')
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
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin can create seats',
  })
  @ApiBody({ type: CreateSeatDto })
  createSeat(
    @Body() createSeatDto: CreateSeatDto,
    @Req() req: RequestWithUser,
  ) {
    if (req.user.role_id === Role.ADMIN) {
      return this.seatService.createSeat(createSeatDto);
    }
    throw new ForbiddenException('Only admin can create seats');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update seat by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Seat updated successfully',
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
    @Req() req: RequestWithUser,
  ) {
    if (req.user.role_id === Role.ADMIN) {
      return this.seatService.updateSeat(id, updateSeatDto);
    }
    throw new ForbiddenException('Only admin can update seats');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete seat by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Seat deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin can delete seats',
  })
  @ApiResponse({
    status: 404,
    description: 'Seat not found',
  })
  deleteSeat(@Param('id') id: string, @Req() req: RequestWithUser) {
    if (req.user.role_id === Role.ADMIN) {
      return this.seatService.deleteSeat(id);
    }
    throw new ForbiddenException('Only admin can delete seats');
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update seat status by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Seat status updated successfully',
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
    @Body('status') status: boolean,
    @Req() req: RequestWithUser,
  ) {
    if (req.user.role_id === Role.ADMIN) {
      return this.seatService.updateSeatStatus(id, status);
    }
    throw new ForbiddenException('Only admin can update seat status');
  }

  @Post('hold-seat')
  @ApiOperation({ summary: 'Hold seats for a user' })
  @ApiBody({ type: HoldSeatDto })
  @ApiBearerAuth()
  holdSeat(@Body() body: HoldSeatDto, @Req() req: RequestWithUser) {
    return this.seatService.holdSeat(body, req);
  }

  @Patch('cancel-hold-seat')
  @ApiOperation({ summary: 'Cancel hold on seats for a user' })
  @ApiBody({ type: HoldSeatDto })
  @ApiBearerAuth()
  cancelHoldSeat(@Body() body: HoldSeatDto, @Req() req: RequestWithUser) {
    return this.seatService.cancelHoldSeat(body, req);
  }
}
