import {
  Controller,
  Get,
  Query,
  Res,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BarcodeService } from 'src/common/barcode/barcode.service';
import {
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Role } from 'src/common/enums/roles.enum';
import { JWTUserType } from 'src/common/utils/type';

@ApiTags('Barcode')
@ApiBearerAuth()
@Controller('barcode')
@UseGuards(JwtAuthGuard)
export class BarcodeController {
  constructor(private readonly barcodeService: BarcodeService) {}

  @Get('scan')
  @ApiOperation({ summary: 'Scan barcode to get user information' })
  @ApiQuery({
    name: 'code',
    required: true,
    description: 'Code barcode scan',
  })
  async scanBarcode(
    @Query('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user as JWTUserType;

    // ✅ Chỉ cho phép ADMIN và EMPLOYEE quét barcode
    if (![Role.ADMIN, Role.EMPLOYEE].includes(user.role_id)) {
      throw new ForbiddenException(
        'You do not have permission to scan barcode.',
      );
    }

    const result = await this.barcodeService.scanBarcode(code);
    return res.status(200).json(result);
  }
}
