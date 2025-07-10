import { BasePaginationDto } from '../basePagination.dto';
import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UserPaginationDto extends BasePaginationDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsString()
  roleId?: string;
}
