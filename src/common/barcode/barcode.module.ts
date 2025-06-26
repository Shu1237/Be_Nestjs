import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../../database/entities/user/user';
// import { BarcodeController } from './barcode.controller';
import { BarcodeService } from './barcode.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [BarcodeService],
  exports: [BarcodeService],
})
export class BarcodeModule {}
