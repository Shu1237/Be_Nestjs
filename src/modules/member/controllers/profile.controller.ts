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
import { BarcodeService } from 'src/common/barcode/barcode.service';
import { ScanQrCodeDto } from 'src/modules/order/dto/qrcode.dto';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly barcodeService: BarcodeService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@Req() req: Request) {
    const user = req.user as JWTUserType;
    return this.profileService.getProfile(user.account_id, user.role_id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update user profile (admin and member only)' })
  async updateProfile(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = req.user as JWTUserType;
    return this.profileService.updateProfile(user.account_id, updateUserDto);
  }

  @Get('barcode')
  @ApiOperation({ summary: 'Get barcode for current user (image)' })
  async getBarcode(@Req() req: Request, @Res() res: Response) {
    const user = req.user as JWTUserType;
    const { barcode } = await this.barcodeService.getUserBarcode(
      user.account_id,
    );

    // Giải mã base64 thành buffer
    const base64Data = barcode.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename=barcode.png');
    return res.send(buffer);
  }
  @Post('qrcode')
  @ApiOperation({ summary: 'Get QR code for current user (image)' })
  @ApiBody({ type: ScanQrCodeDto, description: 'QR code data' })
  async getQrCode(@Body() body: ScanQrCodeDto, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can access QR code.');
    return this.profileService.getQrCode(body.qrCode);

  }
}
