import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateVersionDto {
  @IsOptional()
  @IsString()
  name?: string;


}