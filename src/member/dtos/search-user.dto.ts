import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/enum/roles.enum';

export class SearchUserDto {
  @ApiProperty({
    description: 'Keyword for searching (username or email)',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: 'Filter by Role ID',
    required: false,
    enum: Role,
  })
  @IsOptional()
  @IsEnum(Role)
  role_id?: Role;

  @ApiProperty({
    description: 'Filter by status (true for active, false for inactive)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiProperty({ description: 'Page number for pagination', required: false })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({
    description: 'Limit per page for pagination',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
