import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { BasePaginationDto } from '../basePagination.dto';

export class VersionPaginationDto extends BasePaginationDto {
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
