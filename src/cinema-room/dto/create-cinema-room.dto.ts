import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCinemaRoomDto {
  @IsString()
  @ApiProperty({ description: 'Tên của phòng chiếu', example: 'Room A' })
  cinema_room_name: string;

  @IsOptional()
  @ApiProperty({ description: 'Trạng thái xóa của phòng chiếu (true nếu đã bị xóa)', example: false })
  is_deleted?: boolean;
}