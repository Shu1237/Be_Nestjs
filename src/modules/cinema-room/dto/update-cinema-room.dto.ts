import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateCinemaRoomDto } from './create-cinema-room.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCinemaRoomDto extends PartialType(CreateCinemaRoomDto) {
  @IsString()
  @ApiProperty({ description: 'Name of the cinema room', example: 'Room A' })
  cinema_room_name: string;
}
