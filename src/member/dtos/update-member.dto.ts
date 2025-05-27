import { IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMemberDto {
  @ApiPropertyOptional({ example: 200, description: 'Điểm thành viên' })
  @IsOptional()
  @IsNumber()
  SCORE?: number;

  @ApiPropertyOptional({
    example: '93cb78e4-7d41-433e-b4bc-6a0e15d839a6',
    description: 'ID tài khoản liên kết',
  })
  @IsOptional()
  @IsUUID()
  ACCOUNT_ID?: string;
}
