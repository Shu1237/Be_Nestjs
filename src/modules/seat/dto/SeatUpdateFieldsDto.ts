import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SeatUpdateFieldsDto {
  @ApiProperty({
    description: 'New seat row',
    example: 'A',
    required: false,
  })
  @IsOptional()
  @IsString()
  seat_row?: string;

  @ApiProperty({
    description: 'New seat column',
    example: '5',
    required: false,
  })
  @IsOptional()
  @IsString()
  seat_column?: string;

  @ApiProperty({
    description: 'New seat type ID',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString()
  seat_type_id?: string;

  @ApiProperty({
    description: 'New cinema room ID',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString()
  cinema_room_id?: string;
}
