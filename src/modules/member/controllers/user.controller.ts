import {
  Controller,
  Get,
  Body,
  Param,
  Put,
  UseGuards,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { UserService } from '../services/user.service';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserPaginationDto } from 'src/common/pagination/dto/user/userPagination.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'src/common/enums/roles.enum';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
  @ApiOperation({ summary: 'Get all users for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, type: Boolean, example: true })
  @ApiQuery({ name: 'roleId', required: false, type: String, example: '2' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'john.doe@example.com',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'user.status',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  findAll(@Query() query: UserPaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;

    return this.userService.findAll({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Update user by ID (admin only)' })
  @ApiBody({ type: UpdateUserDto })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Toggle user status by ID (admin only)' })
  async toggleStatus(@Param('id') id: string) {
    return await this.userService.toggleStatus(id);
  }

  
}