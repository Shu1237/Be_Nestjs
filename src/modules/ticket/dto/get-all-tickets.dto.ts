import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GetAllTicketsDto {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit: number = 10;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  is_used?: boolean;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  startDate?: string; // ISO date

  @IsOptional()
  @IsString()
  endDate?: string; // ISO date

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'], {
    message: 'sortOrder must be ASC or DESC',
  })
  sortOrder?: 'ASC' | 'DESC';
}
