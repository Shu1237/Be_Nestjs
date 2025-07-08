
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { CreateOrderBillDto } from './order-bill.dto';

export class OrderBillUserAgainDto extends CreateOrderBillDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  orderId: number;
}
