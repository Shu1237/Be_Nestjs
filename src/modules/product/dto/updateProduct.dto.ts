import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsNotEmpty, Matches, Min, Max, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductTypeEnum } from 'src/common/enums/product.enum';

export class UpdateProductDto {
  @IsOptional()
  @IsString({ message: 'Tên sản phẩm phải là chuỗi' })
  @ApiPropertyOptional({ description: 'Tên sản phẩm', example: 'Coca Cola' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Giá sản phẩm phải là chuỗi' })
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'Giá sản phẩm phải là số hợp lệ (VD: 12000 hoặc 12000.50)' })
  @ApiPropertyOptional({
    description: 'Giá sản phẩm (decimal, kiểu string)',
    example: '12000',
  })
  price?: string;

  @IsOptional()
  @IsEnum(ProductTypeEnum, { message: 'Loại sản phẩm phải là drink, combo, hoặc food' })
  @ApiPropertyOptional({
    description: 'Loại sản phẩm',
    example: 'drink | combo | food',
    enum: ProductTypeEnum,
  })
  category?: ProductTypeEnum;

  @ValidateIf(o => o.category === ProductTypeEnum.COMBO || (o.discount !== undefined && o.discount !== null))
  @IsNumber({}, { message: 'Giảm giá phải là số' })
  @Min(0, { message: 'Giảm giá không được nhỏ hơn 0%' })
  @Max(100, { message: 'Giảm giá không được lớn hơn 100%' })
  @ApiPropertyOptional({ description: 'Giảm giá (%) - Chỉ áp dụng cho combo', example: 10 })
  discount?: number;
}
