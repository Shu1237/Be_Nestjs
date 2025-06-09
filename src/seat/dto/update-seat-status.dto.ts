import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSeatStatusDto {
  @ApiProperty({
    description: 'New status of the seat',
    example: true,
  })
  @IsBoolean()
  status: boolean;
} 