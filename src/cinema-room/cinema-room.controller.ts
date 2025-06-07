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
  ForbiddenException,
} from '@nestjs/common';
import { CinemaRoomService } from './cinema-room.service';
import { CreateCinemaRoomDto } from './dto/create-cinema-room.dto';
import { UpdateCinemaRoomDto } from './dto/update-cinema-room.dto';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JWTUserType } from '../utils/type';
import { Role } from '../enum/roles.enum';
import { JwtAuthGuard } from 'src/guards/jwt.guard';


@ApiTags('Cinema Rooms')
@ApiBearerAuth()
@Controller('cinema-rooms')
export class CinemaRoomController {
  constructor(private readonly cinemaRoomService: CinemaRoomService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new cinema room (admin, employee only)' })
  @ApiResponse({
    status: 201,
    description: 'Cinema room created successfully.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(@Body() createCinemaRoomDto: CreateCinemaRoomDto, @Req() req) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin or employee can create a cinema room.',
      );
    }
    return await this.cinemaRoomService.create(createCinemaRoomDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all cinema rooms' })
  @ApiResponse({ status: 200, description: 'List of cinema rooms.' })
  async findAll() {
    return await this.cinemaRoomService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get cinema room by ID' })
  @ApiResponse({ status: 200, description: 'Cinema room found.' })
  async findOne(@Param('id') id: number) {
    return await this.cinemaRoomService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update cinema room by ID (admin, employee only)' })
  @ApiResponse({
    status: 200,
    description: 'Cinema room updated successfully.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async update(
    @Param('id') id: number,
    @Body() updateCinemaRoomDto: UpdateCinemaRoomDto,
    @Req() req,
  ) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin or employee can update a cinema room.',
      );
    }
    return await this.cinemaRoomService.update(id, updateCinemaRoomDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete cinema room by ID (admin, employee only)' })
  @ApiResponse({
    status: 200,
    description: 'Cinema room deleted successfully.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async remove(@Param('id') id: number, @Req() req) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin or employee can delete a cinema room.',
      );
    }
    return await this.cinemaRoomService.remove(id);
  }
}
