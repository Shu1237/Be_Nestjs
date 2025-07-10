import { Type } from "class-transformer";
import { IsOptional, Min, IsString } from "class-validator";
import { BasePaginationDto } from "../basePagination.dto";



export class HistoryScorePaginationDto extends BasePaginationDto {

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;





}