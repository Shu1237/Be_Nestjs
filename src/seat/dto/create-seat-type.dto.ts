import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateSeatTypeDto {
  @ApiProperty({
    description: 'Tên loại ghế',
    example: 'Ghế VIP',
  })
  @IsString()
  seat_type_name: string;

  @ApiProperty({
    description: 'Giá loại ghế',
    example: 150000,
  })
  @IsNumber()
  @Min(0)
  seat_type_price: number;

  @ApiProperty({
    description: 'Mô tả loại ghế',
    example: 'Ghế VIP với không gian rộng rãi',
    required: false,
  })
  @IsOptional()
  @IsString()
  seat_type_description?: string;
} 