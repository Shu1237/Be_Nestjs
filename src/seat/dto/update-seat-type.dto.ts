import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSeatTypeDto {
  @ApiProperty({
    description: 'Name of the seat type',
    example: 'VIP',
    required: false,
  })
  @IsOptional()
  @IsString()
  seat_type_name?: string;

  @ApiProperty({
    description: 'Price of the seat type',
    example: 150000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  seat_type_price?: number;
}