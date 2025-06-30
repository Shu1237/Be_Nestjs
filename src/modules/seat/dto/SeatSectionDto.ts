import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  IsString,
} from 'class-validator';

export class SeatSectionDto {
  @ApiProperty({
    example: 1,
    description: 'ID của loại ghế (Normal, VIP, Deluxe, Couple)',
  })
  @IsInt()
  seat_type_id: number;

  @ApiPropertyOptional({
    example: 2,
    description:
      'Số hàng ghế liên tục (vd: tạo 2 hàng liên tiếp cho loại ghế này)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(26)
  seat_rows?: number;

  @ApiPropertyOptional({
    example: ['C1', 'C2', 'C3'],
    description: 'Danh sách ID ghế cụ thể (ví dụ cho ghế lẻ như Couple)',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  seat_ids?: string[];
}
