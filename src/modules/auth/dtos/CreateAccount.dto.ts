import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsDateString,
  Length,
  Matches,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateAccountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsDateString()
  @Transform(({ value }) => new Date(value).toISOString().split('T')[0]) // Chuyển đổi sang định dạng YYYY-MM-DD
  @IsNotEmpty()
  date_of_birth: Date;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  gender: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(9, 12)
  identity_card: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  image?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(6, 32)
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,11}$/, { message: 'phone_number must be 10-11 digits' })
  phone_number: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiPropertyOptional({
    default: 1,
    description: '1: User, 2: Employee, 3: Admin',
  })
  @IsOptional()
  @IsNumber()
  role_id?: number;
}
//     @ApiPropertyOptional({ default: 1, description: '1: User, 2: Employee, 3: Admin' })
//   @IsOptional()
//   @Type(() => Number)
//   @IsNumber()
//   role_id?: number;
// }
