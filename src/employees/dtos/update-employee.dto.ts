import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({
    example: '93cb78e4-7d41-433e-b4bc-6a0e15d839a6',
    description: 'ID của tài khoản nhân viên',
  })
  @IsOptional()
  @IsUUID()
  ACCOUNT_ID?: string;
}
