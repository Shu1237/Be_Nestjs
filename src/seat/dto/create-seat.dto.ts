import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSeatDto {
  @ApiProperty({
    description: 'ID của ghế',
    example: 'A1',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Hàng của ghế',
    example: 'A',
  })
  @IsString()
  seat_row: string;

  @ApiProperty({
    description: 'Cột của ghế',
    example: '1',
  })
  @IsString()
  seat_column: string;

  @ApiProperty({
    description: 'ID loại ghế',
    example: 1,
  })
  @IsString()
  seat_type_id: string;

  @ApiProperty({
    description: 'ID phòng chiếu',
    example: 1,
  })
  @IsString()
  cinema_room_id: string;
}
