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
import { SeatTypeService } from './seat-type.service';
import { CreateSeatTypeDto } from './dto/create-seat-type.dto';
import { UpdateSeatTypeDto } from './dto/update-seat-type.dto';
import { Request } from 'express';
import { JWTUserType } from 'src/utils/type';
import { Role } from 'src/enum/roles.enum';

@ApiTags('Seat Types')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('seat-types')
export class SeatTypeController {
  constructor(private readonly seatTypeService: SeatTypeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all seat types' })
  @ApiResponse({
    status: 200,
    description: 'List of all seat types',
  })
  getAllSeatTypes() {
    return this.seatTypeService.getAllSeatTypes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get seat type by ID' })
  @ApiResponse({
    status: 200,
    description: 'Seat type found',
  })
  @ApiResponse({
    status: 404,
    description: 'Seat type not found',
  })
  getSeatTypeById(@Param('id') id: string) {
    return this.seatTypeService.getSeatTypeById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new seat type (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Seat type created successfully',
    example: { msg: 'Seat type created successfully' },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin can create seat types',
  })
  @ApiBody({ type: CreateSeatTypeDto })
  createSeatType(
    @Body() createSeatTypeDto: CreateSeatTypeDto,
    @Req() req: Request,
  ) {
    const user = req.user as JWTUserType;
    if (user.role_id === Role.ADMIN) {
      return this.seatTypeService.createSeatType(createSeatTypeDto);
    }
    throw new ForbiddenException('Only admin can create seat types');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update seat type by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Seat type updated successfully',
    example: { msg: 'Seat type updated successfully' },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin can update seat types',
  })
  @ApiResponse({
    status: 404,
    description: 'Seat type not found',
  })
  @ApiBody({ type: UpdateSeatTypeDto })
  updateSeatType(
    @Param('id') id: string,
    @Body() updateSeatTypeDto: UpdateSeatTypeDto,
    @Req() req: Request,
  ) {
    const user = req.user as JWTUserType;
    if (user.role_id === Role.ADMIN) {
      return this.seatTypeService.updateSeatType(id, updateSeatTypeDto);
    }
    throw new ForbiddenException('Only admin can update seat types');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete seat type by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Seat type deleted successfully',
    example: { msg: 'Seat type deleted successfully' },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin can delete seat types',
  })
  @ApiResponse({
    status: 404,
    description: 'Seat type not found',
  })
  deleteSeatType(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as JWTUserType;
    if (user.role_id === Role.ADMIN) {
      return this.seatTypeService.deleteSeatType(id);
    }
    throw new ForbiddenException('Only admin can delete seat types');
  }
}
