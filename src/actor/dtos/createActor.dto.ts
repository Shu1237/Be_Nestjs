import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateActorDto {
  @ApiProperty({ description: 'The name of the actor', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The stage name of the actor',
    example: 'Johnny',
    required: false,
  })
  @IsString()
  @IsOptional()
  stage_name?: string;

  @ApiProperty({ description: 'The gender of the actor', example: true })
  @IsBoolean()
  @IsNotEmpty()
  gender: boolean;

  @ApiProperty({
    description: 'The date of birth of the actor',
    example: '1990-01-01',
  })
  @Type(() => Date) // Transform string to Date
  @IsDate()
  @IsNotEmpty()
  date_of_birth: Date;

  @ApiProperty({
    description: 'The nationality of the actor',
    example: 'American',
  })
  @IsString()
  @IsNotEmpty()
  nationality: string;

  @ApiProperty({
    description: 'The biography of the actor',
    example: 'An accomplished actor known for...',
  })
  @IsString()
  @IsNotEmpty()
  biography: string;

  @ApiProperty({
    description: 'The profile image URL of the actor',
    example: 'https://example.com/image.jpg',
  })
  @IsUrl()
  @IsNotEmpty()
  profile_image: string;
}
