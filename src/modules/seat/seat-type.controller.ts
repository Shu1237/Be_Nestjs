import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { SeatTypeService } from './seat-type.service';
import { CreateSeatTypeDto } from './dto/create-seat-type.dto';
import { UpdateSeatTypeDto } from './dto/update-seat-type.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';

@ApiTags('Seat Types')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('seat-types')
export class SeatTypeController {
  constructor(private readonly seatTypeService: SeatTypeService) { }
  
  // GET - Get all seat types
  @Get()
  @ApiOperation({ summary: 'Get all seat types' })
  getAllSeatTypes() {
    return this.seatTypeService.getAllSeatTypes();
  }
  // GET - Get seat type by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get seat type by ID' })
  getSeatTypeById(@Param('id') id: string) {
    return this.seatTypeService.getSeatTypeById(id);
  }

  // POST - Create new seat type
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({ summary: 'Create new seat type (admin only)' })
  @ApiBody({ type: CreateSeatTypeDto })
  createSeatType(@Body() createSeatTypeDto: CreateSeatTypeDto) {
    return this.seatTypeService.createSeatType(createSeatTypeDto);
  }
  
  // PUT - Update seat type by ID
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Put(':id')
  @ApiOperation({ summary: 'Update seat type by ID (admin only)' })
  @ApiBody({ type: UpdateSeatTypeDto })
  updateSeatType(
    @Param('id') id: string,
    @Body() updateSeatTypeDto: UpdateSeatTypeDto) {
    return this.seatTypeService.updateSeatType(id, updateSeatTypeDto);
  }

  // DELETE - Delete seat type by ID
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete seat type by ID (admin only)' })
  deleteSeatType(@Param('id') id: string) {
    return this.seatTypeService.deleteSeatType(id);
  }
}
