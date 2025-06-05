import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class ChangePromotionDto {
  @ApiProperty({ example: 1, description: 'ID của chương trình khuyến mãi' })
  @IsInt()
  readonly id: number;

  @ApiProperty({ example: 100, description: 'Số điểm cần để đổi (để kiểm tra ở client, server vẫn kiểm tra lại)' })
  @IsInt()
  @Min(0)
  readonly exchange: number;
}
