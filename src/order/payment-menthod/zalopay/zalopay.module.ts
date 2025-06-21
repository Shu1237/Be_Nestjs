import { Module } from "@nestjs/common";
import { ZalopayService } from "./zalopay.service";
import { MomoModule } from "../momo/momo.module";





@Module({
  imports: [MomoModule,],
  controllers: [],
  providers: [ZalopayService],
  exports: [ZalopayService]
})
export class ZalopayModule { }
