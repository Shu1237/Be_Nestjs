import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleType } from 'src/typeorm/entities/user/roles';

export class CreateUserDto {
  @ApiProperty({ description: 'Username of the new user' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Email of the new user' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Password for the new user' })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Role ID for the new user (1: Member, 2: Employee, 3: Admin)',
    required: false,
    enum: RoleType,
  })
  @IsOptional()
  @IsEnum(RoleType)
  role_id?: RoleType;

  @ApiProperty({ description: 'Address of the new user', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Date of birth of the new user',
    required: false,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiProperty({
    description: 'Gender of the new user',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  gender?: boolean;

  @ApiProperty({
    description: 'Identity card number of the new user',
    required: false,
  })
  @IsOptional()
  @IsString()
  identity_card?: string;

  @ApiProperty({ description: 'Image URL of the new user', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({
    description: 'Phone number of the new user',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone_number?: string;
}
