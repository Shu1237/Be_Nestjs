import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Role } from '../enum/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Return all roles.' })
  findAll() {
    return this.rolesService.findAll();
  }
}
