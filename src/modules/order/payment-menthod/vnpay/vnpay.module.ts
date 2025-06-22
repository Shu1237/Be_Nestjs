import { Module } from "@nestjs/common";
import { VnpayService } from "./vnpay.service";
import { MomoModule } from "../momo/momo.module";






@Module({
    imports: [MomoModule],
    controllers: [],
    providers: [VnpayService],
    exports: [VnpayService],
})
export class VnpayModule { }