import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ description: 'Updated address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Updated date of birth',
    required: false,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiProperty({ description: 'Updated gender', required: false })
  @IsOptional()
  @IsBoolean()
  gender?: boolean;

  @ApiProperty({
    description: 'Updated identity card number',
    required: false,
  })
  @IsOptional()
  @IsString()
  identity_card?: string;

  @ApiProperty({ description: 'Updated image URL', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({
    description: 'Updated phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone_number?: string;
}
