
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { BasePaginationDto } from '../basePagination.dto';
import { Transform } from 'class-transformer';
export class TicketPaginationDto extends BasePaginationDto {
   @Transform(({ value }) => value === 'true' || value === true)
   @IsOptional()
   @IsBoolean()
   is_used?: boolean;
 
   @Transform(({ value }) => value === 'true' || value === true)
   @IsOptional()
   @IsBoolean()
   active?: boolean;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
