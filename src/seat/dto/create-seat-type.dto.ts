import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateSeatTypeDto {
  @ApiProperty({
    description: 'Name of the seat type',
    example: 'VIP',
  })
  @IsNotEmpty()
  @IsString()
  seat_type_name: string;

  @ApiProperty({
    description: 'Price of the seat type',
    example: 150000,
  })
  @IsNotEmpty()
  @IsNumber()
  seat_type_price: number;

  @ApiProperty({
    description: 'Description of the seat type',
    example: 'Ghế VIP với không gian rộng rãi',
  })
  @IsNotEmpty()
  @IsString()
  seat_type_description: string;
}
