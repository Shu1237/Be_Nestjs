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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { UserService } from '../services/user.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/enum/roles.enum';
import { User } from 'src/typeorm/entities/user/user';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { SearchUserDto } from '../dtos/search-user.dto';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { ChangeStatusDto } from '../dtos/change-status.dto';
import { ChangeRoleDto } from '../dtos/change-role.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create a new user (Admin only)',
    description: 'Create a new user account. Only admin can create new users.',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'Data for creating a new user',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('search')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({
    summary: 'Search users',
    description:
      'Search users with filters and pagination. Accessible by admin and employee.',
  })
  @ApiBody({
    type: SearchUserDto,
    description: 'Filters and pagination for user search',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of users and total count',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Employee only' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({
    summary: 'Get user by ID',
    description:
      'Get detailed information about a specific user. Accessible by admin and employee.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns user details',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Employee only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Update user (Admin only)',
    description: 'Update user information. Only admin can update user details.',
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'Data for updating user information',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Delete user (Admin only)',
    description: 'Delete a user account. Only admin can delete users.',
  })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Put(':id/password')
  @ApiOperation({
    summary: 'Change user password (Admin only)',
    description:
      'Change password for a user account. Users can only change their own password.',
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'New password for the user',
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changePassword(
    @Param('id') id: string,
    @Body() body: ChangePasswordDto,
  ) {
    await this.userService.changePassword(id, body.newPassword);
    return { message: 'Password changed successfully' };
  }

  @Put(':id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Change user status (Admin only)',
    description:
      'Enable or disable a user account. Only admin can change user status.',
  })
  @ApiBody({
    type: ChangeStatusDto,
    description:
      'New status for the user (true for active, false for inactive)',
  })
  @ApiResponse({
    status: 200,
    description: 'User status changed successfully',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changeStatus(@Param('id') id: string, @Body() body: ChangeStatusDto) {
    return await this.userService.changeStatus(id, body.status);
  }

  @Put(':id/role')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Change user role (Admin only)',
    description: 'Change the role of a user. Only admin can change user roles.',
  })
  @ApiBody({
    type: ChangeRoleDto,
    description: 'New role ID for the user',
  })
  @ApiResponse({
    status: 200,
    description: 'User role changed successfully',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changeRole(@Param('id') id: string, @Body() body: ChangeRoleDto) {
    return await this.userService.changeRole(id, body.role_id);
  }
}
