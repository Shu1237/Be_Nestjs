import { IsArray, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HoldSeatDto {
  @ApiProperty({
    type: [String],
    description: 'Array of seat IDs to hold or cancel hold',
  })
  @IsArray()
  @IsString({ each: true })
  seatIds: string[];

  @ApiProperty({
    type: Number,
    description: 'Schedule ID where seats are located',
  })
  @IsNumber()
  schedule_id: number;
}
