import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
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
  @ApiProperty({
    description: 'Loại sản phẩm',
    example: 'drink',
    enum: ['food', 'drink', 'combo'],
  })
  type?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Giảm giá (%)', example: 10 })
  discount?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: ' example: false', default: false })
  is_deleted?: boolean;
}
