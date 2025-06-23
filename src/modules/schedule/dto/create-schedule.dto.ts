import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsDate, IsArray } from 'class-validator';

export class CreateScheduleDto {
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

  
  
  @IsInt({ each: true })
  @ApiProperty({
    description: 'Danh sách ID của các diễn viên (actors) liên kết với bộ phim',
    example: 1,
  })
  id_Version?: number;
  
  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Ngày và giờ chiếu phim',
    example: '2025-06-10T14:00:00Z',
  })
  start_movie_time: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Ngày và giờ kết thúc chiếu phim',
    example: '2025-06-10T16:00:00Z',
  })
  end_movie_time: Date;
}
