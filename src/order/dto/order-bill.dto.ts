// create-order-bill.dto.ts
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SeatInfoDto {
  @ApiProperty({ example: 'abc123', description: 'Seat ID' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'A', description: 'Seat row (e.g., A, B, C...)' })
  @IsString()
  seat_row: string;

  @ApiProperty({ example: '5', description: 'Seat column number' })
  @IsString()
  seat_column: string;

  @ApiProperty({ enum: ['adult', 'student', 'child'], description: 'Audience type' })
  @IsEnum(['adult', 'student', 'child'])
  audience_type: 'adult' | 'student' | 'child';
}

export class CreateOrderBillDto {
  @ApiProperty({ example: 'momo', description: 'Payment method' })
  @IsString()
  payment_method: string;

  @ApiProperty({ example: '2025-06-04T10:00:00.000Z', description: 'Booking date' })
  @IsDate()
  @Type(() => Date)
  booking_date: Date;

  @ApiProperty({ example: '250000', description: 'Total price as string' })
  @IsString()
  total_prices: string;

  @ApiPropertyOptional({ example: 1, description: 'Optional promotion ID' })
  @IsOptional()
  @IsNumber()
  promotion_id: number;

  @ApiProperty({ example: 5, description: 'Schedule ID' })
  @IsNumber()
  schedule_id: number;

  @ApiProperty({ type: [SeatInfoDto], description: 'List of selected seats' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatInfoDto)
  seats: SeatInfoDto[];
}
