import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGerneDto {
  @ApiProperty({
    description: 'The content or description of the movie',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  genre_name: string;
}
