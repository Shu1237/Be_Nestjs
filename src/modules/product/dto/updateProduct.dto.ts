import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Tên sản phẩm', example: 'Coca Cola' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Giá sản phẩm (decimal, kiểu string)',
    example: '12000.50',
  })
  price?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Danh mục sản phẩm',
    example: 'Nước giải khát',
  })
  category?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Loại sản phẩm', example: 'drink' })
  type?: string;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ description: 'Giảm giá (%)', example: 10 })
  discount?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'falses', example: false })
  is_deleted?: boolean;
}
