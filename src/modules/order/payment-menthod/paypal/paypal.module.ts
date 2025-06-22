import { Module } from "@nestjs/common";
import { PayPalService } from "./paypal.service";
import { MomoModule } from "../momo/momo.module";




@Module({
    imports: [MomoModule,],
    controllers: [],
    providers: [PayPalService],
    exports: [PayPalService]


})
export class PayPalModule { }
