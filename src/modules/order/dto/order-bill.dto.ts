import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AudienceType } from 'src/common/enums/audience_type.enum';

class SeatInfoDto {
  @ApiProperty({ example: 'abc123', description: 'Seat ID' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'A', description: 'Seat row (e.g., A, B, C...)' })
  @IsString()
  seat_row: string;

  @ApiProperty({ example: '5', description: 'Seat column number' })
  @IsString()
  seat_column: string;

  @ApiProperty({ enum: AudienceType, description: 'Audience type' })
  @IsEnum(AudienceType)
  audience_type: AudienceType;
}

class ProductItemDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsNumber()
  product_id: number;

  @ApiProperty({ example: 2, description: 'Quantity' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderBillDto {
  @ApiProperty({ example: "1", description: 'Payment method ID' })
  @IsString()
  payment_method_id: string;

  @ApiProperty({ example: '250000', description: 'Total price as string' })
  @IsString()
  total_prices: string;

  @ApiPropertyOptional({ example: 1, description: 'Optional promotion ID' })
  @IsNumber()
  promotion_id: number;

  @ApiProperty({ example: 5, description: 'Schedule ID' })
  @IsNumber()
  schedule_id: number;

  @ApiPropertyOptional({ example: 'uuid-customer-id', description: 'ID của khách hàng nếu nhân viên đặt giúp' })
  @IsOptional()
  @IsString()
  customer_id: string;

  @ApiProperty({ type: [SeatInfoDto], description: 'List of selected seats' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatInfoDto)
  seats: SeatInfoDto[];

  @ApiPropertyOptional({ type: [ProductItemDto], description: 'List of products ordered' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductItemDto)
  products?: ProductItemDto[];
}
