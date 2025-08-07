import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  Length,
  Min,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePromotionDto {
  @ApiProperty({ example: 'Summer Sale 2025' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title: string;

  @ApiProperty({ required: false, example: 'Up to 50% off' })
  @IsOptional()
  @IsString()
  detail?: string;

  @ApiProperty({ example: 'Not add more % or VND( vd :50 | 50000)' })
  @IsString()
  @IsNotEmpty()
  discount: string;

  @ApiProperty({ example: 'SUMMER2025' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  code: string;

  @ApiProperty({ 
    example: 10,
    description: 'Points required to exchange for this promotion'
  })
  @IsNumber()
  @Min(0)
  exchange: number;

  @ApiProperty({
    example: 1,
    description: 'Promotion type ID (1: percentage, 2: amount)',
  })
  @IsInt()
  @Min(1)
  promotion_type_id: number;

  @ApiProperty({ required: false, example: '2025-07-01T00:00:00+07:00' })
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @ApiProperty({ required: false, example: '2025-07-10T00:00:00+07:00' })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiProperty({ required: false, example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
