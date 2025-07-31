import { IsOptional, IsString } from 'class-validator';

export class UpdateVersionDto {
  @IsOptional()
  @IsString()
  name?: string;
}
