import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsDate } from 'class-validator';

export class UpdateScheduleDto {
  @IsInt()
  @ApiProperty({ description: 'ID của phòng chiếu liên kết với lịch chiếu', example: 1 })
  cinema_room_id: number;

  @IsInt()
  @ApiProperty({ description: 'ID của bộ phim liên kết với lịch chiếu', example: 1 })
  movie_id: number;

  @IsDate()
  @ApiProperty({ description: 'Ngày và giờ chiếu phim', example: '2025-06-10T14:00:00Z' })
  @Type(() => Date)
  show_date: Date;

}