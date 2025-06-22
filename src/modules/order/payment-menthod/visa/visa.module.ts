import { Module } from "@nestjs/common";
import { VisaService } from "./visa.service";



@Module({
    imports: [],
    controllers: [],
    providers: [VisaService],
    exports: [VisaService],
})
export class VisaModule{}