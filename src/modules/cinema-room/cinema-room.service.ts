import {
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CinemaRoom } from '../../database/entities/cinema/cinema-room';
import { CreateCinemaRoomDto } from './dto/create-cinema-room.dto';
import { UpdateCinemaRoomDto } from './dto/update-cinema-room.dto';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';

@Injectable()
export class CinemaRoomService {
  constructor(
    @InjectRepository(CinemaRoom)
    private readonly cinemaRoomRepository: Repository<CinemaRoom>,
  ) {}

  async create(createCinemaRoomDto: CreateCinemaRoomDto): 
  Promise<{ message: string }> {
    const existing = await this.cinemaRoomRepository.findOne({
      where: { cinema_room_name: createCinemaRoomDto.cinema_room_name },
    });
    if (existing) {
      throw new BadRequestException('Tên phòng chiếu đã tồn tại');
    }
    const cinemaRoom = this.cinemaRoomRepository.create(createCinemaRoomDto);
    await this.cinemaRoomRepository.save(cinemaRoom);
    return {
      message: 'Cinema room created successfully',
    }
  }

  async findAll(): Promise<CinemaRoom[]> {
    return await this.cinemaRoomRepository.find();
  }

  async findOne(id: number): Promise<CinemaRoom> {
    const cinemaRoom = await this.cinemaRoomRepository.findOne({
      where: { id },
    });
    if (!cinemaRoom) {
      throw new NotFoundException(`Cinema room with ID ${id} not found`);
    }
    return cinemaRoom;
  }

  async update(
    id: number,
    updateCinemaRoomDto: UpdateCinemaRoomDto,
  ): Promise<{ message: string } > {
    const existing = await this.cinemaRoomRepository.findOne({
      where: { cinema_room_name: updateCinemaRoomDto.cinema_room_name },
    });
    if (existing) {
      throw new BadRequestException('Tên phòng chiếu đã tồn tại');
    }
    const cinemaRoom = await this.findOne(id);
    Object.assign(cinemaRoom, updateCinemaRoomDto);
     await this.cinemaRoomRepository.save(cinemaRoom);
     return {
      message: 'Cinema room updated successfully',
     }
  }

  async remove(id: number): Promise<{ msg: string }> {
    const cinemaRoom = await this.findOne(id);
    await this.cinemaRoomRepository.remove(cinemaRoom);
    return { msg: 'Cinema Room deleted successfully' };
  }
  async softDeleteCinemaRoom(
    id: number,
  ): Promise<{ msg: string; cinemaRoom: CinemaRoom }> {
    const cinemaRoom = await this.cinemaRoomRepository.findOne({
      where: { id },
    });
    if (!cinemaRoom) {
      throw new NotFoundException(`Cinema Room with ID ${id} not found`);
    }

    cinemaRoom.is_deleted = true; // Đánh dấu là đã xóa
    await this.cinemaRoomRepository.save(cinemaRoom);

    return { msg: 'Cinema Room soft-deleted successfully', cinemaRoom };
  }

  async restoreCinemaRoom(
    id: number,
  ): Promise<{ msg: string; cinemaRoom: CinemaRoom }> {
    const cinemaRoom = await this.cinemaRoomRepository.findOne({
      where: { id },
    });
    if (!cinemaRoom) {
      throw new NotFoundException(`Cinema Room with ID ${id} not found`);
    }
    if (!cinemaRoom.is_deleted) {
      throw new BadRequestException(
        `Cinema Room with ID ${id} is not soft-deleted`,
      );
    }
    cinemaRoom.is_deleted = false;
    await this.cinemaRoomRepository.save(cinemaRoom);
    return { msg: 'Cinema Room restored successfully', cinemaRoom };
  }
}
