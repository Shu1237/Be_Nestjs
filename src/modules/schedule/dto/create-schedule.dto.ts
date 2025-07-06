import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateScheduleDto {
  @IsInt()
  @ApiProperty({ description: 'ID phòng chiếu', example: 1 })
  cinema_room_id: number;

  @IsInt()
  @ApiProperty({ description: 'ID phim', example: 1 })
  movie_id: number;

  @IsInt()
  @ApiProperty({ description: 'ID version', example: 1 })
  id_Version: number;

  @IsString()
  @ApiProperty({
    description: 'Thời gian bắt đầu chiếu (giờ Việt Nam, định dạng YYYY-MM-DD HH:mm)',
    example: '2025-06-10 14:00',
  })
  start_movie_time: string;

  @IsString()
  @ApiProperty({
    description: 'Thời gian kết thúc chiếu (giờ Việt Nam, định dạng YYYY-MM-DD HH:mm)',
    example: '2025-06-10 16:00',
  })
  end_movie_time: string;
}
