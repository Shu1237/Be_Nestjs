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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { UserService } from '../services/user.service';
import { Role } from 'src/common/enums/roles.enum';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { Request } from 'express';
import { JWTUserType } from 'src/common/utils/type';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('get-all')
  @ApiOperation({ summary: 'Search all users (admin, employee only)' })
  findAll(@Req() req: Request) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException('Only admin or employee can search users');
    }
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin, employee only)' })
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
  @ApiBody({ type: UpdateUserDto })
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
  async softDelete(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can delete users');
    }

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
