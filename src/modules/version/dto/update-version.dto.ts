import { ApiProperty } from '@nestjs/swagger/dist/decorators/api-property.decorator';
import { IsOptional, IsString } from 'class-validator';

export class UpdateVersionDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Version name',
    example: 'Updated Version 1',
  })
  name?: string;
}
