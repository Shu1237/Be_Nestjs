import { BasePaginationDto } from '../basePagination.dto';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PromotionPaginationDto extends BasePaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exchange?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exchangeFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exchangeTo?: number;

  @IsOptional()
  @IsString()
  promotion_type_id?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string; 

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_active?: string; 
}
