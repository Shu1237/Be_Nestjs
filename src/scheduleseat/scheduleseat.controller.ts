import { Body, Controller, Get, Param, ParseIntPipe, UseGuards } from "@nestjs/common";
import { ScheduleSeatService } from "./scheduleseat.service";
import { JwtAuthGuard } from "src/guards/jwt.guard";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";


@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('scheduleseat')
export class ScheduleSeatController {


    constructor(
        private readonly scheduleSeatService: ScheduleSeatService,
    ) { }



    @Get(':id')
    @ApiOperation({ summary: 'Get seats by schedule ID' })
    async findSeatByScheduleId(@Param('id', ParseIntPipe) id: number) {
        return this.scheduleSeatService.findSeatByScheduleId(id);
    }
}