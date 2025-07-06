import {
  Controller,
  Get,
  Body,
  Param,
  Put,
  UseGuards,
  Req,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { UserService } from '../services/user.service';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';
import { checkAdminRole } from 'src/common/role/admin';
import { UserPaginationDto } from 'src/common/pagination/dto/user/userPagination.dto';


@Controller('users')
// @UseGuards(JwtAuthGuard)
// @ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  @ApiOperation({ summary: 'Search all users (admin, employee only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, type: Boolean, example: true })
  @ApiQuery({ name: 'roleId', required: false, type: String, example: '2' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'john.doe@example.com' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'user.status' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], example: 'DESC' })
  findAll(@Query() query: UserPaginationDto, @Req() req) {
    // checkAdminEmployeeRole(req.user, 'Only admin or employee can view all users');
    const {
      page = 1,
      take = 10,
      ...restFilters
    } = query;

    return this.userService.findAll({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin, employee only)' })
  findOne(@Param('id') id: string, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Only admin or employee can view user details');
    return this.userService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user by ID (admin only)' })
  @ApiBody({ type: UpdateUserDto })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req,
  ) {
    checkAdminRole(req.user, 'Only admin can update users');
    return this.userService.update(id, updateUserDto);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Soft delete user by ID (admin only)' })
  async softDelete(@Param('id') id: string, @Req() req) {
    checkAdminRole(req.user, 'Only admin can soft delete users');
    await this.userService.softDelete(id);
    return { msg: 'Delete successfully' };
  }

  // @Put(':id/status')
  // @ApiOperation({ summary: 'Toggle user status by ID (admin only)' })
  // async changeStatus(@Param('id') id: string, @Req() req: Request) {
  //   const user = req.user as JWTUserType;
  //   if (user.role_id !== Role.ADMIN) {
  //     throw new ForbiddenException('Only admin can change user status');
  //   }
  //   await this.userService.changeStatus(id);
  //   return { msg: 'Change status successfully' };
  // }
}
