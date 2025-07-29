import { IsOptional, IsString, IsIn } from 'class-validator';
import {
  StatusOrderWithAll,
  StatusOrderWithAllType,
} from 'src/common/enums/status-order.enum';
import { BasePaginationDto } from '../basePagination.dto';

export class OrderPaginationDto extends BasePaginationDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsIn(StatusOrderWithAll, {
    message: `status must be one of: ${StatusOrderWithAll.join(', ')}`,
  })
  status?: StatusOrderWithAllType;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
