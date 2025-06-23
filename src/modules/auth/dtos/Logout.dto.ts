import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    description: 'The refresh token to be invalidated',
    type: String,
  })
  @IsString()
  refresh_token: string;
}
