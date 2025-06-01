// login.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user123', description: 'Username of the account' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'secretPassword', description: 'Password of the account' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
