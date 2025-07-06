import { BasePaginationDto } from '../basePagination.dto';
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SchedulePaginationDto extends BasePaginationDto {
  @IsOptional()
  @IsString()
  movieName?: string;

  @IsOptional()
  @IsString()
  cinemaRoomName?: string;

  @IsOptional()
  @IsString()
  scheduleStartTime?: string;

  @IsOptional()
  @IsString()
  scheduleEndTime?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  version_id?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_deleted?: boolean;
}
