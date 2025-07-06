import { BasePaginationDto } from '../basePagination.dto';
import { IsOptional, IsString, IsIn } from 'class-validator';

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
  from_date?: string; 

  @IsOptional()
  @IsString()
  to_date?: string;


  @IsOptional()
  @IsString()
  actor_id?: string;

  @IsOptional()
  @IsString()
  gerne_id?: string;

  @IsOptional()
  @IsString()
  version_id?: string;
}
