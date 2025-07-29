import { Transform } from 'class-transformer';
import { BasePaginationDto } from '../basePagination.dto';
import { IsOptional, IsString, IsIn, IsBoolean } from 'class-validator';

export class MoviePaginationDto extends BasePaginationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  director?: string;

  @IsOptional()
  @IsString()
  nation?: string;

  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;

  @IsOptional()
  @IsString()
  actor_id?: string;

  @IsOptional()
  @IsString()
  gerne_id?: string;

  @IsOptional()
  @IsString()
  version_id?: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
