import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCinemaRoomDto {
  @IsString()
  @ApiProperty({ description: 'Name of the cinema room', example: 'Room A' })
  cinema_room_name: string;
}
