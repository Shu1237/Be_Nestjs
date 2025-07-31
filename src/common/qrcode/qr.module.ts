import { Module } from '@nestjs/common';
import { QrCodeService } from './qrcode.service';
import { S3Module } from 'src/common/s3/s3.module';

@Module({
  imports: [S3Module],
  providers: [QrCodeService],
  exports: [QrCodeService],
})
export class QrCodeModule {}
