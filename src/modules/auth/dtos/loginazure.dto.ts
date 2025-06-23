import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class LoginAzureDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sub: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  picture: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  role_id?: number;
}
