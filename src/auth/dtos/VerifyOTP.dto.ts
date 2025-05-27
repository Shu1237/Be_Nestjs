import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: '123456',
    description: 'The OTP code sent to the user for verification',
  })
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address associated with the OTP code',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
