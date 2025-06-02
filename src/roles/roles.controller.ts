import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '../enum/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles(Role.ADMIN)
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
  findAll() {
    return this.rolesService.findAll();
  }
}
