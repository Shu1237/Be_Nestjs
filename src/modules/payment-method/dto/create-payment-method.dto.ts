import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
  @IsString()
  @ApiProperty({
    example: 'Credit Card',
    description: 'Tên phương thức thanh toán',
  })
  name: string;
}
