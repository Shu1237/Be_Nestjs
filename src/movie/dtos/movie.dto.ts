import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsDate,
  IsOptional,
} from 'class-validator';

export class MovieDTO {
  @ApiProperty({ description: 'The name of the movie', example: 'Inception' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The content or description of the movie',
    example: 'A mind-bending thriller about dreams within dreams.',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    description: 'The director of the movie',
    example: 'Christopher Nolan',
  })
  @IsNotEmpty()
  @IsString()
  director: string;

  @ApiProperty({
    description: 'The duration of the movie in minutes',
    example: 148,
  })
  @IsNotEmpty()
  @IsInt()
  duration: number;

  @ApiProperty({
    description: 'The start date of the movie showing',
    example: '2025-06-01',
    type: String,
    format: 'date',
  })
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @Type(() => Date)
  @IsDate()
  from_date: Date;

  @ApiProperty({
    description: 'The end date of the movie showing',
    example: '2025-06-30',
    type: String,
    format: 'date',
  })
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @Type(() => Date)
  @IsDate()
  to_date: Date;

  @ApiProperty({
    description: 'The production company of the movie',
    example: 'Warner Bros.',
  })
  @IsNotEmpty()
  @IsString()
  production_company: string;

  @ApiProperty({
    description: 'The thumbnail image URL of the movie',
    example: 'https://example.com/thumbnail.jpg',
  })
  @IsNotEmpty()
  @IsString()
  thumbnail: string;

  @ApiProperty({
    description: 'The banner image URL of the movie',
    example: 'https://example.com/banner.jpg',
  })
  @IsNotEmpty()
  @IsString()
  banner: string;

  @ApiPropertyOptional({
    description: 'The version of the movie (e.g., 2D, 3D, IMAX)',
    example: 'IMAX',
  })
  @IsOptional()
  @IsString()
  version?: string;
}
