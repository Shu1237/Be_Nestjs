import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'The username of the user' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'The avatar URL of the user' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Role ID of the user (admin only)' })
  @IsOptional()
  role_id?: number;
}
