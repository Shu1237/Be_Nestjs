import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BarcodeService } from './barcode.service';

@Controller('barcode')
@UseGuards(JwtAuthGuard)
export class BarcodeController {
  constructor(private readonly barcodeService: BarcodeService) {}
  // Đã chuyển endpoint sang ProfileController, không còn endpoint ở đây nữa.
}
