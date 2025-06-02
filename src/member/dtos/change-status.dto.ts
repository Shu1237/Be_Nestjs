import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeStatusDto {
  @ApiProperty({
    description:
      'New status for the user (true for active, false for inactive)',
  })
  @IsBoolean()
  status: boolean;
}
