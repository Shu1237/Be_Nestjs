import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '../enum/roles.enum';

import { Request } from 'express';
import { JwtAuthGuard } from 'src/guards/jwt.guard';

interface RequestWithUser extends Request {
  user: {
    role_id: Role;
  };
}

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all roles',
    description: 'Only accessible by admin users',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all roles.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have admin role',
  })
  findAll(@Req() req: RequestWithUser) {
    const user = req.user;
    if (user.role_id !== Role.ADMIN) {
      throw new ForbiddenException('Only admin users can access this resource');
    }
    return this.rolesService.findAll();
  }
}
