import { BasePaginationDto } from '../basePagination.dto';
import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class SeatPaginationDto extends BasePaginationDto {
  @IsOptional()
  @IsNumber()
  cinema_room_id?: number;

  @IsOptional()
  @IsNumber()
  seat_type_id?: number;

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
