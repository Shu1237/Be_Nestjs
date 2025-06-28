import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  Min,
  Max,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class BulkCreateSeatDto {
  @ApiProperty({ example: 4, description: 'Số hàng ghế (theo chiều Y)' })
  @IsInt()
  @Min(1)
  @Max(26) // A-Z
  seat_rows: number;

  @ApiProperty({ example: 5, description: 'Số cột ghế (theo chiều X)' })
  @IsInt()
  @Min(1)
  @Max(50)
  seat_column: number;

  @ApiProperty({ example: '1' })
  @IsOptional()
  @IsNumber()
  seat_type_id: number;

  @ApiProperty({ example: '2' })
  @IsString()
  cinema_room_id: string;
}
