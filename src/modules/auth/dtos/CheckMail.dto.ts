import { IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckEmail {
  @ApiProperty({
    description: 'Email cần kiểm tra',
    example: 'example@gmail.com',
  })
  @IsString()
  @IsEmail()
  email: string;
}
