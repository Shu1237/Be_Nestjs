import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BarcodeService } from './barcode.service';
import {
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Role } from 'src/common/enums/roles.enum';
import { JWTUserType } from 'src/common/utils/type';

@ApiTags('Barcode')
@ApiBearerAuth()
@Controller('barcode')
@UseGuards(JwtAuthGuard)
export class BarcodeController {
  constructor(private readonly barcodeService: BarcodeService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy mã barcode của người dùng hiện tại (qua JWT)' })
  async getCurrentUserBarcode(@Req() req: Request) {
    const user = req.user as JWTUserType;
    const result = await this.barcodeService.getUserBarcode(user.account_id);

    return {
      status: 'success',
      message: 'Lấy barcode thành công',
      data: result,
    };
  }

  @Get('scan')
  @ApiOperation({ summary: 'Quét barcode để lấy thông tin người dùng' })
  @ApiQuery({
    name: 'code',
    required: true,
    description: 'Giá trị mã vạch cần quét (10 ký tự)',
  })
  async scanBarcode(@Query('code') code: string, @Req() req: Request) {
    const user = req.user as JWTUserType;

    if (![Role.ADMIN, Role.EMPLOYEE].includes(user.role_id)) {
      throw new ForbiddenException('Bạn không có quyền quét mã vạch');
    }

    return this.barcodeService.scanBarcode(code);
  }
}
