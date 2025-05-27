import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMemberDto {
  @ApiProperty({ example: 100, description: 'Member Point' })
  @IsNotEmpty()
  @IsNumber()
  SCORE: number;

  @ApiProperty({
    example: '93cb78e4-7d41-433e-b4bc-6a0e15d839a6',
    description: 'ID Member Account',
  })
  @IsNotEmpty()
  @IsUUID()
  ACCOUNT_ID: string;
}
