import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';
export class TicketMarkUsedDto {
    @ApiProperty({
        description: 'List of seat IDs to mark as used',
        type: [String],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    seatIds: string[];
}
