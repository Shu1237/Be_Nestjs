import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordOtpDto {
  @ApiProperty({ example: 'NewStrongPassword123!' })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiProperty({ example: 'temp.jwt.token.here' })
  @IsString()
  tmptoken: string;
}
