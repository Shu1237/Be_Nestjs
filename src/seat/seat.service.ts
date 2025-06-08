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

@Injectable()
export class SeatService {
  constructor(
    @InjectRepository(Seat) private seatRepository: Repository<Seat>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getAllSeats() {
    return this.seatRepository.find({
      relations: ['seatType', 'cinemaRoom'],
    });
  }

  async getSeatById(id: string) {
    const seat = await this.seatRepository.findOne({
      where: { id },
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
    const seat = this.seatRepository.create(createSeatDto);
    return this.seatRepository.save(seat);
  }

  async updateSeat(id: string, updateSeatDto: UpdateSeatDto) {
    const seat = await this.getSeatById(id);
    Object.assign(seat, updateSeatDto);
    return this.seatRepository.save(seat);
  }

  async deleteSeat(id: string) {
    const seat = await this.getSeatById(id);
    return this.seatRepository.remove(seat);
  }

  async updateSeatStatus(id: string, status: boolean) {
    const seat = await this.getSeatById(id);
    seat.status = status;
    return this.seatRepository.save(seat);
  }

  async holdSeat(data: HoldSeatType, req: any) {
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

  async cancelHoldSeat(data: HoldSeatType, req: any) {
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
