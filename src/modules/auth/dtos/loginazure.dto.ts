import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class LoginAzureDto {
  @ApiProperty()
  @IsString()
  sub: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
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
