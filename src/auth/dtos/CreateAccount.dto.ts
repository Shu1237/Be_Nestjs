import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsDateString,
  Length,
  Matches,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ADDRESS: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  DATE_OF_BIRTH: Date;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  EMAIL: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  FULL_NAME: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  GENDER: number;

  @ApiProperty()
  @IsString()
  @Length(9, 12)
  IDENTITY_CARD: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  IMAGE?: string;

  @ApiProperty()
  @IsString()
  @Length(6, 32)
  PASSWORD: string;

  @ApiProperty()
  @IsString()
  @Matches(/^\d{10,11}$/, { message: 'PHONE_NUMBER must be 10-11 digits' })
  PHONE_NUMBER: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  USERNAME: string;

  @ApiPropertyOptional({ default: 1, description: '1: User, 2: Employee, 3: Admin' })
  @IsOptional()
  @IsNumber()
  ROLE_ID?: number;
}
