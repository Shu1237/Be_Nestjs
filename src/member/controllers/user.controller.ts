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
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { UserService } from '../services/user.service';
import { Role } from 'src/enum/roles.enum';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { ChangeStatusDto } from '../dtos/change-status.dto';
import { Request } from 'express';
import { User } from 'src/typeorm/entities/user/user';

interface RequestWithUser extends Request {
  user: {
    role_id: Role;
  };
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('search')
  @ApiOperation({ summary: 'Search all users (admin, employee only)' })
  @ApiResponse({
    status: 200,
    description: 'List of users.',
    type: [User],
    examples: {
      example1: {
        value: [
          {
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
          {
            id: '2',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@example.com',
            phone: '0987654321',
            address: '456 Oak St',
            status: true,
            is_deleted: false,
            role: {
              id: 2,
              name: 'EMPLOYEE',
            },
          },
        ],
        summary: 'List of active users',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Only admin or employee can search users.',
    examples: {
      example1: {
        value: {
          statusCode: 403,
          message: 'Only admin or employee can search users',
        },
        summary: 'Forbidden response',
      },
    },
  })
  findAll(@Req() req: RequestWithUser) {
    const user = req.user;
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
    examples: {
      example1: {
        value: {
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
        summary: 'User details',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
    examples: {
      example1: {
        value: {
          statusCode: 404,
          message: 'User with ID 999 not found',
        },
        summary: 'Not found response',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Only admin or employee can view user details.',
    examples: {
      example1: {
        value: {
          statusCode: 403,
          message: 'Only admin or employee can view user details',
        },
        summary: 'Forbidden response',
      },
    },
  })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    const user = req.user;
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
    examples: {
      example1: {
        value: {
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
        summary: 'Updated user details',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
    examples: {
      example1: {
        value: {
          statusCode: 404,
          message: 'User with ID 999 not found',
        },
        summary: 'Not found response',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Only admin can update users.',
    examples: {
      example1: {
        value: {
          statusCode: 403,
          message: 'Only admin can update users',
        },
        summary: 'Forbidden response',
      },
    },
  })
  @ApiBody({
    type: UpdateUserDto,
    examples: {
      example1: {
        value: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          phone: '0123456789',
          address: '123 Main St',
          role_id: 1,
        },
        summary: 'Update user information',
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    if (user.role_id !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can update users');
    }
    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Soft delete user by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User soft-deleted successfully.',
    type: User,
    examples: {
      example1: {
        value: {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          phone: '0123456789',
          address: '123 Main St',
          status: true,
          is_deleted: true,
          role: {
            id: 1,
            name: 'MEMBER',
          },
        },
        summary: 'Soft-deleted user details',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
    examples: {
      example1: {
        value: {
          statusCode: 404,
          message: 'User with ID 999 not found',
        },
        summary: 'Not found response',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Only admin can delete users.',
    examples: {
      example1: {
        value: {
          statusCode: 403,
          message: 'Only admin can delete users',
        },
        summary: 'Forbidden response',
      },
    },
  })
  softDelete(@Param('id') id: string, @Req() req: RequestWithUser) {
    const user = req.user;
    if (user.role_id !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can delete users');
    }
    return this.userService.softDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hard delete user by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User deleted Successfully.',
    examples: {
      example1: {
        value: {
          message: 'User deleted Successfully',
        },
        summary: 'Success response',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
    examples: {
      example1: {
        value: {
          statusCode: 404,
          message: 'User with ID 999 not found',
        },
        summary: 'Not found response',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Only admin can permanently delete users.',
    examples: {
      example1: {
        value: {
          statusCode: 403,
          message: 'Only admin can permanently delete users',
        },
        summary: 'Forbidden response',
      },
    },
  })
  hardDelete(@Param('id') id: string, @Req() req: RequestWithUser) {
    const user = req.user;
    if (user.role_id !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can permanently delete users');
    }
    return this.userService.hardDelete(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Change user status by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User status changed successfully.',
    type: User,
    examples: {
      example1: {
        value: {
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
        summary: 'User with enabled status',
      },
      example2: {
        value: {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          phone: '0123456789',
          address: '123 Main St',
          status: false,
          is_deleted: false,
          role: {
            id: 1,
            name: 'MEMBER',
          },
        },
        summary: 'User with disabled status',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
    examples: {
      example1: {
        value: {
          statusCode: 404,
          message: 'User with ID 999 not found',
        },
        summary: 'Not found response',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Only admin can change user status.',
    examples: {
      example1: {
        value: {
          statusCode: 403,
          message: 'Only admin can change user status',
        },
        summary: 'Forbidden response',
      },
    },
  })
  @ApiBody({
    type: ChangeStatusDto,
    examples: {
      example1: {
        value: {
          status: true,
        },
        summary: 'Enable user',
      },
      example2: {
        value: {
          status: false,
        },
        summary: 'Disable user',
      },
    },
  })
  async changeStatus(
    @Param('id') id: string,
    @Body() body: ChangeStatusDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    if (user.role_id !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can change user status');
    }
    return await this.userService.changeStatus(id, body.status);
  }
}
