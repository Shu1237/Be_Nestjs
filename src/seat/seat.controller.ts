import { Body, Controller, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { SeatService } from "./seat.service";
import { JwtAuthGuard } from "src/guards/jwt.guard";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { HoldSeatDto } from "./dto/hold-seat.dto";

@ApiTags('Seat')
@UseGuards(JwtAuthGuard)
@Controller("seat")
export class SeatController {
   constructor(private seatService: SeatService) {}

   @Post('hold-seat')
   @ApiOperation({ summary: 'Hold seats for a user' })
   @ApiBody({ type: HoldSeatDto })
   @ApiBearerAuth()
   holdSeat(@Body() body: HoldSeatDto, @Request() req) {
       return this.seatService.holdSeat(body, req);
   }

   @Patch('cancel-hold-seat')
   @ApiOperation({ summary: 'Cancel hold on seats for a user' })
   @ApiBody({ type: HoldSeatDto })
   @ApiBearerAuth()
   cancelHoldSeat(@Body() body: HoldSeatDto, @Request() req) {
       return this.seatService.cancelHoldSeat(body, req);
   }
}
