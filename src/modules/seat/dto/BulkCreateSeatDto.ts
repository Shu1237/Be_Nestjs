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
    description: 'Số lượng cột ghế trong phòng (áp dụng khi dùng seat_rows)',
  })
  @IsInt()
  @Min(1)
  @Max(50)
  seat_column: number;

  @ApiProperty({
    type: [SeatSectionDto],
    description:
      'Danh sách các section ghế để tạo theo loại (rows hoặc seat_ids)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatSectionDto)
  sections: SeatSectionDto[];

  @ApiProperty({
    example: '3',
    description: 'ID của phòng chiếu',
  })
  @IsString()
  cinema_room_id: string;
}
