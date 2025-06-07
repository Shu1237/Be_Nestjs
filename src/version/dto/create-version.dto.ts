import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateVersionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Tên của phiên bản',
    example: 'Version 1',
  })
  name: string;

}