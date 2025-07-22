import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  Res,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { Request, Response } from 'express';
import { ProfileService } from '../services/profile.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { JWTUserType } from 'src/common/utils/type';
import { ScanQrCodeDto } from 'src/modules/order/dto/qrcode.dto';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';
import { checkEmployeeRole } from 'src/common/role/emloyee';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@Req() req: Request) {
    const user = req.user as JWTUserType;
    return this.profileService.getProfile(user.account_id, user.role_id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ) {

    const user = req.user as JWTUserType;
    return this.profileService.updateProfile(user.account_id, updateUserDto);


  }
  
  @Post('qrcode')
  @ApiOperation({ summary: 'Get QR code for current user (image)' })
  @ApiBody({ type: ScanQrCodeDto, description: 'QR code data' })
  async getQrCode(@Body() body: ScanQrCodeDto, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can access QR code.');
    return this.profileService.getQrCode(body.qrCode);

  }
}
