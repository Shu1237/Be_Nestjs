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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { UserService } from '../services/user.service';
import { Role } from 'src/enum/roles.enum';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { SearchUserDto } from '../dtos/search-user.dto';

import { ChangeStatusDto } from '../dtos/change-status.dto';
import { ChangeRoleDto } from '../dtos/change-role.dto';
import { ChangePasswordDto } from 'src/auth/dtos/ChangePassword';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) { }

  @ApiBody({ type: CreateUserDto })
  @Post('create')
  create(@Body() createUserDto: CreateUserDto, @Req() req) {
    const user = req.user;
    if (user.role_id !== Role.ADMIN) {
      throw new Error('Forbidden - Only admin can create users');
    }
    return this.userService.create(createUserDto);
  }



  @Post('search')
  @ApiBody({ type: SearchUserDto })
  findAll(@Req() req) {
    const user = req.user;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new Error('Forbidden - Only admin or employee can search users');
    }
    return this.userService.findAll();
  }



  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    const user = req.user;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new Error('Forbidden - Only admin or employee can view user details');
    }
    return this.userService.findOne(id);
  }

  @Put(':id')
  @ApiBody({ type: UpdateUserDto })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req) {
    const user = req.user;
    if (user.role_id !== Role.ADMIN) {
      throw new Error('Forbidden - Only admin can update users');
    }
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const user = req.user;
    if (user.role_id !== Role.ADMIN) {
      throw new Error('Forbidden - Only admin can delete users');
    }
    return this.userService.remove(id);
  }

  @Put(':id/password')
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(
    @Param('id') id: string,
    @Body() body: ChangePasswordDto,
  ) {
    await this.userService.changePassword(id, body.newPassword);
    return { message: 'Password changed successfully' };
  }

  @Put(':id/status')
  @ApiBody({ type: ChangeStatusDto })
  async changeStatus(@Param('id') id: string, @Body() body: ChangeStatusDto,@Req() req) {
    const user = req.user;
    if (user.role_id !== Role.ADMIN) {
      throw new Error('Forbidden - Only admin can change user status');
    }
    return await this.userService.changeStatus(id, body.status);
  }

  @Put(':id/role')
  @ApiBody({ type: ChangeRoleDto })
  async changeRole(@Param('id') id: string, @Body() body: ChangeRoleDto,@Req() req) {
    const user = req.user;
    if (user.role_id !== Role.ADMIN) {
      throw new Error('Forbidden - Only admin can change user role');
    }
    return await this.userService.changeRole(id, body.role_id);
  }
}
