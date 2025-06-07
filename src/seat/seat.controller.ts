// import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
// import { SeatService } from './seat.service';
// import { CreateSeatDto } from './dto/create-seat.dto';
// import { UpdateSeatDto } from './dto/update-seat.dto';

// import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

// @ApiTags('Seats')
// @ApiBearerAuth()
// @Controller('seats')
// export class SeatController {
//   constructor(private readonly seatService: SeatService) {}

//   @UseGuards(JwtAuthGuard)
//   @Post()
//   @ApiOperation({ summary: 'Create a new seat' })
//   @ApiResponse({ status: 201, description: 'Seat created successfully.' })
//   async create(@Body() createSeatDto: CreateSeatDto) {
//     return await this.seatService.create(createSeatDto);
//   }

//   @UseGuards(JwtAuthGuard)
//   @Get()
//   @ApiOperation({ summary: 'Get all seats' })
//   @ApiResponse({ status: 200, description: 'List of seats.' })
//   async findAll() {
//     return await this.seatService.findAll();
//   }

//   @UseGuards(JwtAuthGuard)
//   @Get(':id')
//   @ApiOperation({ summary: 'Get seat by ID' })
//   @ApiResponse({ status: 200, description: 'Seat found.' })
//   async findOne(@Param('id') id: number) {
//     return await this.seatService.findOne(id);
//   }

//   @UseGuards(JwtAuthGuard)
//   @Patch(':id')
//   @ApiOperation({ summary: 'Update seat by ID' })
//   @ApiResponse({ status: 200, description: 'Seat updated successfully.' })
//   async update(@Param('id') id: number, @Body() updateSeatDto: UpdateSeatDto) {
//     return await this.seatService.update(id, updateSeatDto);
//   }

//   @UseGuards(JwtAuthGuard)
//   @Delete(':id')
//   @ApiOperation({ summary: 'Delete seat by ID' })
//   @ApiResponse({ status: 200, description: 'Seat deleted successfully.' })
//   async remove(@Param('id') id: number) {
//     return await this.seatService.remove(id);
//   }
// }