import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsInt, Min, Max, IsNumber } from 'class-validator';
import { BasePaginationDto } from '../basePagination.dto';

export class DailyReportDto extends BasePaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  @Type(() => Number)
  paymentMethod?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  reportDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fromDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  toDate?: Date;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalAmount?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  totalOrders?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  totalFailed?: number;
}
