import { Controller, Get } from "@nestjs/common";
import { TesterService } from "./tester.service";


@Controller('tester')
export class TesterController {
    constructor(private readonly testerService: TesterService) { }
        
    
   
    @Get()
    getTesterInfo() {
        return this.testerService.getSchedulesExpired()
    }

}