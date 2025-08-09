import { IsString,  IsNumber, IsEnum, Min, Max, ValidateIf, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductTypeEnum } from 'src/common/enums/product.enum';

export class UpdateProductDto {
    @IsNotEmpty({ message: 'The name must not be empty' })
    @IsString({ message: 'The name must be a string' })
    @ApiProperty({ description: 'Product name', example: 'Coca Cola' })
    name: string;
  
    @IsNotEmpty({ message: 'The price must not be empty' })
    @IsString()
    @ApiProperty({
      description: 'Product price',
      example: '12000',
    })
    price: string;
  
    @IsNotEmpty({ message: 'The category must not be empty' })
    @IsEnum(ProductTypeEnum, { message: 'The category must be one of the following: drink, combo, food' })
    @ApiProperty({
      description: 'Product category',
      example: 'drink | combo | food',
      enum: ProductTypeEnum,
    })
    category: ProductTypeEnum;
  
    @ValidateIf(o => o.category === ProductTypeEnum.COMBO)
    @IsNotEmpty({ message: 'Combo must have a discount' })
    @IsNumber({}, { message: 'Discount must be a number' })
    @Min(0, { message: 'Discount cannot be less than 0%' })
    @Max(100, { message: 'Discount cannot be greater than 100%' })
    @ApiPropertyOptional({ description: 'Discount (%) - Required if combo', example: 10 })
    discount?: number;
}
