import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePromotionDto {
  @ApiProperty({
    description: 'Title of the promotion',
    example: 'Spring Promotion 2025',
  })
  @IsString()
  @Length(1, 255)
  title: string;

  @ApiProperty({
    description: 'Detail of the promotion',
    required: false,
    example: 'Get 20% off on all spring items',
  })
  @IsOptional()
  @IsString()
  detail?: string;

  @ApiProperty({
    description: 'Discount level of the promotion',
    example: '20%',
  })
  @IsString()
  discount: string;

  @ApiProperty({
    description: 'Promotion code',
    example: 'SPRING123',
  })
  @IsString()
  @Length(1, 255)
  code: string;

  @ApiProperty({
    description: 'Points required to exchange',
    example: 10,
  })
  @IsNumber()
  exchange: number;

  @ApiProperty({
    description: 'Start time of promotion',
    required: false,
    example: '2025-06-07',
  })
  @IsOptional()
  @IsDateString()
  start_time?: Date;

  @ApiProperty({
    description: 'End time of promotion',
    required: false,
    example: '2025-06-10',
  })
  @IsOptional()
  @IsDateString()
  end_time?: Date;

  @ApiProperty({
    description: 'Whether promotion is active',
    required: false,
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}
