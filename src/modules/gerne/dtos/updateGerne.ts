import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateGerneDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  genre_name: string;
}
