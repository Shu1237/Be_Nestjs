import { Transform } from 'class-transformer';
import { BasePaginationDto } from '../basePagination.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ProductPaginationDto extends BasePaginationDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
