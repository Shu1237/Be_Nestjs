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
    description: 'Seat type ID (Normal, VIP, Deluxe, Couple)',
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
    description: 'List of specific seat IDs (e.g., for individual seats like Couple)',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  seat_ids?: string[];
}
