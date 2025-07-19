import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class BulkSeatIdsDto {
  @ApiProperty({
    description: 'Room ID where seats belong',
    example: 'room-123',
  })
  @IsString()
  @IsNotEmpty()
  room_id: string;

  @ApiProperty({
    description: 'Array of seat IDs',
    type: [String],
    example: ['R1_A1', 'R1_A2', 'R1_B1'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one seat ID must be provided' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  seat_ids: string[];
}
