import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateSeatDto {
  @ApiProperty({
    description: 'Hàng của ghế',
    example: 'A',
    required: false,
  })
  @IsOptional()
  @IsString()
  seat_row?: string;

  @ApiProperty({
    description: 'Cột của ghế',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString()
  seat_column?: string;

  @ApiProperty({
    description: 'Trạng thái ghế',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiProperty({
    description: 'ID loại ghế',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsString()
  seat_type_id?: string;

  @ApiProperty({
    description: 'ID phòng chiếu',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsString()
  cinema_room_id?: string;
}
