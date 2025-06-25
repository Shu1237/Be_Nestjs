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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { SeatService } from './seat.service';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { Request } from 'express';
import { JWTUserType } from 'src/common/utils/type';
import { Role } from 'src/common/enums/roles.enum';
import { BulkCreateSeatDto } from './dto/BulkCreateSeatDto';

@ApiTags('Seats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('seat')
export class SeatController {
  constructor(private readonly seatService: SeatService) {}

  @Get()
  @ApiOperation({ summary: 'Get all seats' })
  getAllSeats() {
    return this.seatService.getAllSeats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get seat by ID' })
  getSeatById(@Param('id') id: string) {
    return this.seatService.getSeatById(id);
  }

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Get seats by room ID' })
  getSeatsByRoom(@Param('roomId') roomId: string) {
    return this.seatService.getSeatsByRoom(roomId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update seat by ID (admin only)' })
  @ApiBody({ type: UpdateSeatDto })
  updateSeat(
    @Param('id') id: string,
    @Body() updateSeatDto: UpdateSeatDto,
    @Req() req: Request,
  ) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN) {
      throw new Error('Only admin can update seats');
    }
    return this.seatService.updateSeat(id, updateSeatDto);
  }
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
  @Post()
  @ApiOperation({ summary: 'Create new seat (admin only)' })
  @ApiBody({ type: CreateSeatDto })
  createSeat(@Body() createSeatDto: CreateSeatDto, @Req() req: Request) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN) {
      throw new Error('Only admin can create seats');
    }
    return this.seatService.createSeat(createSeatDto);
  }
  @Post('bulk')
  @ApiOperation({ summary: 'Create Seat By Row & Col' })
  createSeatsBulk(@Body() dto: BulkCreateSeatDto) {
    return this.seatService.createSeatsBulk(dto);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Soft delete seat by ID (admin only)' })
  deleteSeat(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN) {
      throw new Error('Only admin can delete seats');
    }
    return this.seatService.deleteSeat(id);
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
