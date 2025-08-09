import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateScheduleDto {
  @IsInt()
  @ApiProperty({ description: 'Schedule room ID', example: 1 })
  cinema_room_id: number;

  @IsInt()
  @ApiProperty({ description: 'Movie ID', example: 1 })
  movie_id: number;

  @IsInt()
  @ApiProperty({ description: 'ID version', example: 1 })
  id_Version: number;

  @IsString()
  @ApiProperty({
    description:
      'Start time of the movie (Vietnam time, format YYYY-MM-DD HH:mm)',
    example: '2025-06-10 14:00',
  })
  start_movie_time: string;

  @IsString()
  @ApiProperty({
    description:
      'End time of the movie (Vietnam time, format YYYY-MM-DD HH:mm)',
    example: '2025-06-10 16:00',
  })
  end_movie_time: string;
}
