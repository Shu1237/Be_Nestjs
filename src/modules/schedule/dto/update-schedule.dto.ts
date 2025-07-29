import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class UpdateScheduleDto {
  @IsInt()
  @ApiProperty({
    description: 'ID của phòng chiếu liên kết với lịch chiếu',
    example: 1,
  })
  cinema_room_id: number;

  @IsInt()
  @ApiProperty({
    description: 'ID của bộ phim liên kết với lịch chiếu',
    example: 1,
  })
  movie_id: number;

  @IsString()
  @ApiProperty({
    description:
      'Ngày và giờ bắt đầu chiếu phim (giờ Việt Nam, định dạng: YYYY-MM-DD HH:mm)',
    example: '2025-06-10 14:00',
  })
  start_movie_time: string;

  @IsString()
  @ApiProperty({
    description:
      'Ngày và giờ kết thúc chiếu phim (giờ Việt Nam, định dạng: YYYY-MM-DD HH:mm)',
    example: '2025-06-10 16:00',
  })
  end_movie_time: string;
}
