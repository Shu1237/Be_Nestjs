import { extend } from 'dayjs';
import { BasePaginationDto } from '../basePagination.dto';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GernePaginationDto extends BasePaginationDto {
      @Transform(({ value }) => value === 'true' || value === true)
      @IsOptional()
      @IsBoolean()
      is_deleted?: boolean;
}
