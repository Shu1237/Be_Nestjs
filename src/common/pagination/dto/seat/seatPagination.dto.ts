import { BasePaginationDto } from '../basePagination.dto';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class SeatPaginationDto extends BasePaginationDto {
  @IsOptional()
  @IsString()
  cinema_room_id?: string;

  @IsOptional()
  @IsString()
  seat_type_id?: string;

  @IsOptional()
  @IsString()
  seat_row?: string;

  @IsOptional()
  @IsString()
  seat_column?: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
