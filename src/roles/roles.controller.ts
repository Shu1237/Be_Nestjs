import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '../enum/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';



@ApiTags('roles')
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
  findAll(@Req() req) {
    const user = req.user;
    if (user.role_id !== Role.ADMIN) {
      throw new Error('Forbidden - Only admin can access roles');
    }
    return this.rolesService.findAll();
  }
}
