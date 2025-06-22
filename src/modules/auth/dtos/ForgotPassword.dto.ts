import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email used to receive OTP for password reset',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
