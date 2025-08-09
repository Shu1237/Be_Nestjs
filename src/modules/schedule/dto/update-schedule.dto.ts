import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class UpdateScheduleDto {
  @IsInt()
  @ApiProperty({
    description: 'Update Schedule ID',
    example: 1,
  })
  cinema_room_id: number;

  @IsInt()
  @ApiProperty({
    description: 'Update Movie ID',
    example: 1,
  })
  movie_id: number;

  @IsString()
  @ApiProperty({
    description:
      'Start time of the movie schedule (Vietnam time, format: YYYY-MM-DD HH:mm)',
    example: '2025-06-10 14:00',
  })
  start_movie_time: string;

  @IsString()
  @ApiProperty({
    description:
      'End time of the movie schedule (Vietnam time, format: YYYY-MM-DD HH:mm)',
    example: '2025-06-10 16:00',
  })
  end_movie_time: string;
}
