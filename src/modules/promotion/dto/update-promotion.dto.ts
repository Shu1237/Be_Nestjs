import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  Length,
  Min,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePromotionDto {
  @ApiProperty({ required: false, example: 'Summer Sale 2025' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @ApiProperty({ required: false, example: 'Up to 50% off' })
  @IsOptional()
  @IsString()
  detail?: string;

  @ApiProperty({ required: false, example: 'Not add more % or VND( vd :50 | 50000)' })
  @IsOptional()
  @IsString()
  discount?: string;

  @ApiProperty({ required: false, example: 'SUMMER2025' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  code?: string;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exchange?: number;

  @ApiProperty({
    required: false,
    example: 1,
    description: 'Promotion type ID (1: percentage, 2: amount)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  promotion_type_id?: number;

  @ApiProperty({ required: false, example: '2025-07-01T00:00:00+07:00' })
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @ApiProperty({ required: false, example: '2025-07-10T00:00:00+07:00' })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
