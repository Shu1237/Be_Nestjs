import { IsInt, IsString } from 'class-validator';

export class UpdateSeatDto {
  @IsInt()
  seat_type_id: number;

  @IsInt()
  cinema_room_id: number;

  @IsString()
  seat_row: string;

  @IsString()
  seat_column: string;
}