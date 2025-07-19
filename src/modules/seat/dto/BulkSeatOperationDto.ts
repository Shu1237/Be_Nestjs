import { ApiProperty } from '@nestjs/swagger';
import { SeatUpdateFieldsDto } from './SeatUpdateFieldsDto';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkSeatOperationDto {
  @ApiProperty({
    description: 'Array of seat IDs to update',
    example: ['R1_A1', 'R1_A2', 'R1_B1'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one seat ID must be provided' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  seat_ids: string[];

  @ApiProperty({
    description: 'Fields to update',
    type: SeatUpdateFieldsDto,
  })
  @ValidateNested()
  @Type(() => SeatUpdateFieldsDto)
  updates: SeatUpdateFieldsDto;
}
