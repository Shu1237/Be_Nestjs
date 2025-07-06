import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { SeatTypeService } from './seat-type.service';
import { CreateSeatTypeDto } from './dto/create-seat-type.dto';
import { UpdateSeatTypeDto } from './dto/update-seat-type.dto';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';

@ApiTags('Seat Types')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('seat-types')
export class SeatTypeController {
  constructor(private readonly seatTypeService: SeatTypeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all seat types' })
  getAllSeatTypes() {
    return this.seatTypeService.getAllSeatTypes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get seat type by ID' })
  getSeatTypeById(@Param('id') id: string) {
    return this.seatTypeService.getSeatTypeById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new seat type (admin only)' })
  @ApiBody({ type: CreateSeatTypeDto })
  createSeatType(
    @Body() createSeatTypeDto: CreateSeatTypeDto,
    @Req() req,
  ) {
    checkAdminEmployeeRole(req.user, 'Only admin can create seat types');
    return this.seatTypeService.createSeatType(createSeatTypeDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update seat type by ID (admin only)' })
  @ApiBody({ type: UpdateSeatTypeDto })
  updateSeatType(
    @Param('id') id: string,
    @Body() updateSeatTypeDto: UpdateSeatTypeDto,
    @Req() req,
  ) {
    checkAdminEmployeeRole(req.user, 'Only admin can update seat types');
    return this.seatTypeService.updateSeatType(id, updateSeatTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete seat type by ID (admin only)' })
  deleteSeatType(@Param('id') id: string, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Only admin can delete seat types');
    return this.seatTypeService.deleteSeatType(id);
  }
}
