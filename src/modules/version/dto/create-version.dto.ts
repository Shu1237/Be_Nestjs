import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty,  IsString, } from 'class-validator';

export class CreateVersionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Version name',
    example: 'Version 1',
  })
  name: string;
}
