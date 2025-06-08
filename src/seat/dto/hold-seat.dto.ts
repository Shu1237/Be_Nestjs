// src/seat/dto/hold-seat.dto.ts
import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HoldSeatDto {
  @ApiProperty({ type: [String], description: 'Array of seat IDs to hold or cancel hold' })
  @IsArray()
  @IsString({ each: true })
  seatIds: string[];

  @ApiProperty({ type: Number, description: 'Cinema ID where seats are located' })
  cinema_id: number;
}
