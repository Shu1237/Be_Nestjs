import { BasePaginationDto } from '../basePagination.dto';
import { IsOptional, IsNumber, IsBooleanString, IsString, IsBoolean } from 'class-validator';
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
  promtion_type_id?: string;

  @IsOptional()
  @IsString()
  startTime?: string; // định dạng yyyy-MM-dd

  @IsOptional()
  @IsString()
  endTime?: string; // định dạng yyyy-MM-dd


  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_active?: string; // 'true' hoặc 'false' dạng string (vì query param)
}
