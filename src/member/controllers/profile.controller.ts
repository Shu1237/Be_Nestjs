import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { UpdateUserDto } from '../dtos/update-user.dto';
import { Request } from 'express';
import { Role } from 'src/enum/roles.enum';
import { ProfileService } from '../services/profile.service';

interface RequestWithUser extends Request {
  user: {
    account_id: string;
    username: string;
    role_id: Role;
  };
}

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Return user profile' })
  async getProfile(@Req() req: RequestWithUser) {
    return await this.profileService.getProfile(
      req.user.account_id,
      req.user.role_id,
    );
  }

  @Put('me')
  @ApiOperation({ summary: 'Update user profile (admin and member only)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Employee cannot update profile',
  })
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (req.user.role_id === Role.EMPLOYEE) {
      throw new ForbiddenException('Employee cannot update profile');
    }
    return await this.profileService.updateProfile(
      req.user.account_id,
      updateUserDto,
    );
  }
}
