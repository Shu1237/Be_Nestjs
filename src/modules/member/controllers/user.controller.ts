import {
  Controller,
  Get,
  Body,
  Param,
  Put,
  UseGuards,
  Req,
  ForbiddenException,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { UserService } from '../services/user.service';
import { Role } from 'src/common/enums/roles.enum';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { Request } from 'express';
import { User } from 'src/database/entities/user/user';
import { JWTUserType } from 'src/common/utils/type';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('get-all')
  @ApiOperation({ summary: 'Search all users (admin, employee only)' })
  @ApiResponse({
    status: 200,
    description: 'List of users.',
    type: [User],
    example: [],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden.',
    example: {
      statusCode: 403,
      message: 'Only admin or employee can search users',
    },
  })
  findAll(@Req() req: Request) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException('Only admin or employee can search users');
    }
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin, employee only)' })
  @ApiResponse({
    status: 200,
    description: 'User found.',
    type: User,
    example: {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '0123456789',
      address: '123 Main St',
      status: true,
      is_deleted: false,
      role: {
        id: 1,
        name: 'MEMBER',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin or employee can view user details',
  })
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Only admin or employee can view user details',
      );
    }
    return this.userService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully.',
    type: User,
    example: {
      id: '1',
      address: '123 Main St',
      date_of_birth: '1990-01-01',
      gender: true,
      identity_card: '123456789',
      image: 'https://example.com/image.jpg',
      phone_number: '0123456789',
      status: true,
      is_deleted: false,
      role: {
        id: 1,
        name: 'MEMBER',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin can update users',
  })
  @ApiBody({
    type: UpdateUserDto,
    examples: {
      example1: {
        value: {
          address: '123 Main St',
          date_of_birth: '1990-01-01',
          gender: true,
          identity_card: '123456789',
          image: 'https://example.com/image.jpg',
          phone_number: '0123456789',
        },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can update users');
    }
    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Soft delete user by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully.',
    type: User,
    example: {
      msg: 'Delete successfully',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin can delete users',
  })
  async softDelete(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can delete users');
    }

    await this.userService.softDelete(id);
    return { msg: 'Delete successfully' };
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Toggle user status by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User status toggled successfully.',
    example: {
      msg: 'Change status successfully',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin can change user status',
  })
  async changeStatus(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can change user status');
    }
    await this.userService.changeStatus(id);
    return { msg: 'Change status successfully' };
  }
}
