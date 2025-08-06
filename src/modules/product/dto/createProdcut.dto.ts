import { IsString,  IsNumber,  IsEnum, IsNotEmpty,  Min, Max, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductTypeEnum } from 'src/common/enums/product.enum';

export class CreateProductDto {
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @IsString({ message: 'Tên sản phẩm phải là chuỗi' })
  @ApiProperty({ description: 'Tên sản phẩm', example: 'Coca Cola' })
  name: string;

  @IsNotEmpty({ message: 'Giá sản phẩm không được để trống' })
  @IsString()
  @ApiProperty({
    description: 'Giá sản phẩm ',
    example: '12000',
  })
  price: string;

  @IsNotEmpty({ message: 'Loại sản phẩm không được để trống' })
  @IsEnum(ProductTypeEnum, { message: 'Loại sản phẩm phải là drink, combo, hoặc food' })
  @ApiProperty({
    description: 'Loại sản phẩm',
    example: 'drink | combo | food',
    enum: ProductTypeEnum,
  })
  category: ProductTypeEnum;

  @ValidateIf(o => o.category === ProductTypeEnum.COMBO)
  @IsNotEmpty({ message: 'Combo phải có giảm giá' })
  @IsNumber({}, { message: 'Giảm giá phải là số' })
  @Min(0, { message: 'Giảm giá không được nhỏ hơn 0%' })
  @Max(100, { message: 'Giảm giá không được lớn hơn 100%' })
  @ApiPropertyOptional({ description: 'Giảm giá (%) - Bắt buộc nếu là combo', example: 10 })
  discount?: number;
}
