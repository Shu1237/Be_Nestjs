// src/promotion/dto/change-promotion.dto.ts
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ChangePromotionDto {
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  exchange: string;
}
