import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  Length,
} from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  @Length(1, 255)
  title: string;

  @IsOptional()
  @IsString()
  detail?: string;

  @IsString()
  discount_level: string;

  @IsOptional()
  @IsDateString()
  start_time?: string;

  @IsOptional()
  @IsDateString()
  end_time?: string;

  @IsOptional()
  @IsNumber()
  exchange?: number;

  @IsString()
  code: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
