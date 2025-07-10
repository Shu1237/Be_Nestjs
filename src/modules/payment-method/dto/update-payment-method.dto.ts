import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePaymentMethodDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Credit Card', description: 'Tên phương thức thanh toán' })
  name?: string;
}