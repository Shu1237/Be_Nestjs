import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  Min,
  Max,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SeatSectionDto } from './SeatSectionDto';

export class BulkCreateSeatDto {
  @ApiProperty({
    example: 6,
    description: 'The number of rows in the seat section',
  })
  @IsInt()
  @Min(1)
  @Max(50)
  seat_column: number;

  @ApiProperty({
    type: [SeatSectionDto],
    description:
      'List of seat sections to create by type (rows or seat_ids)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatSectionDto)
  sections: SeatSectionDto[];

  @ApiProperty({
    example: '3',
    description: 'ID of the cinema room',
  })
  @IsString()
  cinema_room_id: string;
}
