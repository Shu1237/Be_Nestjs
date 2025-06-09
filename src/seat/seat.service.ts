import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Seat } from 'src/typeorm/entities/cinema/seat';
import { HoldSeatType, JWTUserType } from 'src/utils/type';
import { In, Repository } from 'typeorm';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { SeatType } from 'src/typeorm/entities/cinema/seat-type';
import { CinemaRoom } from 'src/typeorm/entities/cinema/cinema-room';
import { Request } from 'express';

@Injectable()
export class SeatService {
  constructor(
    @InjectRepository(Seat) private seatRepository: Repository<Seat>,
    @InjectRepository(SeatType)
    private seatTypeRepository: Repository<SeatType>,
    @InjectRepository(CinemaRoom)
    private cinemaRoomRepository: Repository<CinemaRoom>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getAllSeats() {
    return this.seatRepository.find({
      where: { is_deleted: false },
      relations: ['seatType', 'cinemaRoom'],
    });
  }

  async getSeatById(id: string) {
    const seat = await this.seatRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['seatType', 'cinemaRoom'],
    });
    if (!seat) {
      throw new NotFoundException('Seat not found');
    }
    return seat;
  }

  async getSeatsByRoom(roomId: string) {
    return this.seatRepository.find({
      where: { cinemaRoom: { id: parseInt(roomId) } },
      relations: ['seatType'],
    });
  }

  async createSeat(createSeatDto: CreateSeatDto) {
    const { seat_type_id, cinema_room_id, ...seatDetails } = createSeatDto;

    const seatType = await this.seatTypeRepository.findOne({
      where: { id: parseInt(seat_type_id) },
    });
    if (!seatType) {
      throw new NotFoundException('Seat type not found');
    }

    const cinemaRoom = await this.cinemaRoomRepository.findOne({
      where: { id: parseInt(cinema_room_id) },
    });
    if (!cinemaRoom) {
      throw new NotFoundException('Cinema room not found');
    }

    const seat = this.seatRepository.create({
      ...seatDetails,
      status: true,
      is_hold: false,
      seatType: seatType,
      cinemaRoom: cinemaRoom,
    });
    await this.seatRepository.save(seat);
    return { msg: 'Seat created successfully' };
  }

  async updateSeat(id: string, updateSeatDto: UpdateSeatDto) {
    const seat = await this.getSeatById(id);
    Object.assign(seat, updateSeatDto);
    await this.seatRepository.save(seat);
    return { msg: 'Seat updated successfully' };
  }

  async deleteSeat(id: string) {
    const seat = await this.getSeatById(id);
    if (seat.is_hold) {
      throw new BadRequestException('Cannot delete a seat that is being held');
    }
    if (seat.is_deleted) {
      throw new BadRequestException('Seat is already deleted');
    }
    await this.seatRepository.update(id, { is_deleted: true });
    return { msg: 'Seat deleted successfully' };
  }

  async updateSeatStatus(id: string) {
    const seat = await this.seatRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['seatType', 'cinemaRoom'],
    });
    
    if (!seat) {
      throw new NotFoundException('Seat not found');
    }

    if (seat.is_hold) {
      throw new BadRequestException('Cannot update status of a seat that is being held');
    }

    // Toggle the status
    await this.seatRepository.update(id, { status: !seat.status });
    
    // Clear any cached data for this seat
    await this.cacheManager.del(`seat-${id}`);
    
    return { msg: 'Change status successfully' };
  }

  async holdSeat(data: HoldSeatType, req: Request) {
    const { seatIds, cinema_id } = data;
    const user = req.user as JWTUserType;

    if (seatIds.length === 0) {
      return { msg: 'No seats selected' };
    }
    const foundSeats = await this.seatRepository.find({
      where: {
        id: In(seatIds),
      },
      relations: ['cinemaRoom'],
    });

    if (foundSeats.length !== seatIds.length) {
      throw new BadRequestException('Some seats do not exist');
    }
    const notMatching = foundSeats.some(
      (seat) => seat.cinemaRoom.id !== cinema_id,
    );
    if (notMatching) {
      throw new BadRequestException(
        'All seats must belong to the same cinema room',
      );
    }

    for (const seat of foundSeats) {
      if (!seat.status) {
        throw new BadRequestException(
          `Seat with ID ${seat.id} was already booked`,
        );
      }
    }

    for (const seat of foundSeats) {
      seat.is_hold = true;
    }
    await this.seatRepository.save(foundSeats);

    await this.cacheManager.set(
      `seat-${user.account_id}`,
      { seatIds: seatIds, cinemaRoom_id: cinema_id },
      { ttl: 600 } as any,
    );

    return {
      msg: 'Seats held successfully',
    };
  }

  async cancelHoldSeat(data: HoldSeatType, req: Request) {
    const user = req.user as JWTUserType;
    const { seatIds, cinema_id } = data;
    if (seatIds.length === 0) {
      return { msg: 'No seats selected' };
    }

    const foundSeats = await this.seatRepository.find({
      where: {
        id: In(seatIds),
      },
      relations: ['cinemaRoom'],
    });

    if (foundSeats.length !== seatIds.length) {
      throw new BadRequestException('Some seats do not exist');
    }
    const notMatching = foundSeats.some(
      (seat) => seat.cinemaRoom.id !== cinema_id,
    );
    if (notMatching) {
      throw new BadRequestException(
        'All seats must belong to the same cinema room',
      );
    }

    for (const seat of foundSeats) {
      if (!seat.is_hold) {
        throw new BadRequestException(`Seat with ID ${seat.id} was not held`);
      }
    }

    for (const seat of foundSeats) {
      seat.is_hold = false;
    }
    await this.seatRepository.save(foundSeats);

    await this.cacheManager.del(`seat-${user.account_id}`);

    return {
      msg: 'Seats un-held successfully',
      released: seatIds,
    };
  }
}
