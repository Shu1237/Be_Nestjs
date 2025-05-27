import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({
    example: '93cb78e4-7d41-433e-b4bc-6a0e15d839a6',
    description: 'ID of the Emoyloyee',
  })
  @IsNotEmpty()
  @IsUUID()
  ACCOUNT_ID: string;
}
