import { Module } from '@nestjs/common';
import { CinemaRoomService } from './cinema-room.service';
import { CinemaRoomController } from './cinema-room.controller';
import { CinemaRoom } from 'src/database/entities/cinema/cinema-room';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([CinemaRoom])],
  controllers: [CinemaRoomController],
  providers: [CinemaRoomService],
})
export class CinemaRoomModule {}
