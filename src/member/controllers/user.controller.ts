import {
  Controller,
  Get,
  Post,
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
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { UserService } from '../services/user.service';
import { Role } from 'src/enum/roles.enum';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { ChangeStatusDto } from '../dtos/change-status.dto';
import { Request } from 'express';
import { User } from 'src/typeorm/entities/user/user';

// Constants
const CONTROLLER_TAG = 'Users';
const CONTROLLER_PATH = 'users';

const ERROR_MESSAGES = {
  SEARCH_USERS: 'Only admin or employee can search users',
  VIEW_USER_DETAILS: 'Only admin or employee can view user details',
  UPDATE_USERS: 'Only admin can update users',
  DELETE_USERS: 'Only admin can delete users',
  CHANGE_STATUS: 'Only admin can change user status',
};

const API_OPERATIONS = {
  GET_ALL: 'Get all users (admin, employee only)',
  GET_ONE: 'Get user by ID (admin, employee only)',
  UPDATE: 'Update user by ID (admin only)',
  SOFT_DELETE: 'Soft delete user by ID (admin only)',
  CHANGE_STATUS: 'Change user status by ID (admin only)',
};

// API Response Decorators
const ApiUserResponse = (description: string) =>
  ApiResponse({
    status: 200,
    description,
    type: User,
    examples: {
      example1: {
        value: {
          id: '1',
          username: 'john_doe',
          email: 'john.doe@example.com',
          address: '123 Main St',
          date_of_birth: '1990-01-01',
          gender: 'male',
          identity_card: '123456789',
          image: 'https://example.com/avatar.jpg',
          phone_number: '0123456789',
          role: {
            role_id: 1,
            role_name: 'MEMBER',
          },
        },
        summary: 'User details',
      },
    },
  });

const ApiUserListResponse = (description: string) =>
  ApiResponse({
    status: 200,
    description,
    type: [User],
    examples: {
      example1: {
        value: [
          {
            id: '1',
            username: 'john_doe',
            email: 'john.doe@example.com',
            address: '123 Main St',
            date_of_birth: '1990-01-01',
            gender: 'male',
            identity_card: '123456789',
            image: 'https://example.com/avatar.jpg',
            phone_number: '0123456789',
            role: {
              role_id: 1,
              role_name: 'MEMBER',
            },
          },
          {
            id: '2',
            username: 'jane_smith',
            email: 'jane.smith@example.com',
            address: '456 Oak St',
            date_of_birth: '1992-02-02',
            gender: 'female',
            identity_card: '987654321',
            image: 'https://example.com/avatar2.jpg',
            phone_number: '0987654321',
            role: {
              role_id: 2,
              role_name: 'EMPLOYEE',
            },
          },
        ],
        summary: 'List of users',
      },
    },
  });

const ApiNotFoundResponse = () =>
  ApiResponse({
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
  });

const ApiForbiddenResponse = (message: string) =>
  ApiResponse({
    status: 403,
    description: `Forbidden: ${message}`,
    examples: {
      example1: {
        value: {
          statusCode: 403,
          message,
        },
        summary: 'Forbidden response',
      },
    },
  });

interface RequestWithUser extends Request {
  user: {
    role_id: Role;
  };
}

@ApiTags(CONTROLLER_TAG)
@ApiBearerAuth()
@Controller(CONTROLLER_PATH)
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  private checkAdminAccess(user: RequestWithUser['user']) {
    if (user.role_id !== Role.ADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.UPDATE_USERS);
    }
  }

  private checkAdminOrEmployeeAccess(user: RequestWithUser['user']) {
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(ERROR_MESSAGES.SEARCH_USERS);
    }
  }

  @Post('get-all')
  @ApiOperation({ summary: API_OPERATIONS.GET_ALL })
  @ApiUserListResponse('List of users')
  @ApiForbiddenResponse(ERROR_MESSAGES.SEARCH_USERS)
  findAll(@Req() req: RequestWithUser) {
    this.checkAdminOrEmployeeAccess(req.user);
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: API_OPERATIONS.GET_ONE })
  @ApiUserResponse('User found')
  @ApiNotFoundResponse()
  @ApiForbiddenResponse(ERROR_MESSAGES.VIEW_USER_DETAILS)
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    this.checkAdminOrEmployeeAccess(req.user);
    return this.userService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: API_OPERATIONS.UPDATE })
  @ApiUserResponse('User updated successfully')
  @ApiNotFoundResponse()
  @ApiForbiddenResponse(ERROR_MESSAGES.UPDATE_USERS)
  @ApiBody({ type: UpdateUserDto })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ) {
    this.checkAdminAccess(req.user);
    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: API_OPERATIONS.SOFT_DELETE })
  @ApiUserResponse('User soft-deleted successfully')
  @ApiNotFoundResponse()
  @ApiForbiddenResponse(ERROR_MESSAGES.DELETE_USERS)
  softDelete(@Param('id') id: string, @Req() req: RequestWithUser) {
    this.checkAdminAccess(req.user);
    return this.userService.softDelete(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: API_OPERATIONS.CHANGE_STATUS })
  @ApiUserResponse('User status changed successfully')
  @ApiNotFoundResponse()
  @ApiForbiddenResponse(ERROR_MESSAGES.CHANGE_STATUS)
  @ApiBody({ type: ChangeStatusDto })
  async changeStatus(
    @Param('id') id: string,
    @Body() body: ChangeStatusDto,
    @Req() req: RequestWithUser,
  ) {
    this.checkAdminAccess(req.user);
    return await this.userService.changeStatus(id, body.status);
  }
}
