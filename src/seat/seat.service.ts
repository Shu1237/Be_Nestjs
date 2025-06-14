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
import { Schedule } from 'src/typeorm/entities/cinema/schedule';
import { ScheduleSeat, SeatStatus } from 'src/typeorm/entities/cinema/schedule_seat';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class SeatService {
  constructor(
    @InjectRepository(Seat) private seatRepository: Repository<Seat>,
    @InjectRepository(SeatType)
    private seatTypeRepository: Repository<SeatType>,
    @InjectRepository(CinemaRoom)
    private cinemaRoomRepository: Repository<CinemaRoom>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    @InjectRepository(ScheduleSeat)
    private scheduleSeatRepository: Repository<ScheduleSeat>,

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
    const { seat_type_id, cinema_room_id } = createSeatDto;

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

    await this.cacheManager.del(`seat-${id}`);

    return { msg: 'Change status successfully' };
  }

  async holdSeat(data: HoldSeatType, req: { user: JWTUserType }) {
    const { seatIds, schedule_id } = data;
    const user = req.user;

    if (seatIds.length === 0) {
      return { msg: 'No seats selected' };
    }

    const schedule = await this.scheduleRepository.findOne({
      where: { id: schedule_id, is_deleted: false },
      relations: ['movie'],
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    const foundSeats = await this.scheduleSeatRepository.find({
      where: {
        schedule: { id: schedule.id },
        seat: { id: In(seatIds) },
      },
      relations: ['seat', 'schedule'],
    });

    if (foundSeats.length === 0) {
      throw new NotFoundException('No seats found for the given IDs');
    }

    if (foundSeats.length !== seatIds.length) {
      throw new BadRequestException('Some seats do not exist in this schedule');
    }

    const checkBookedSeat = foundSeats.filter(
      (seat) => seat.status === SeatStatus.BOOKED || seat.status === SeatStatus.HELD,
    );
    if (checkBookedSeat.length > 0) {
      throw new BadRequestException(
        `Some seats are already booked or held: ${checkBookedSeat.map((s) => s.seat.id).join(', ')}`,
      );
    }

    for (const seat of foundSeats) {
      seat.status = SeatStatus.HELD;
    }

    await this.scheduleSeatRepository.save(foundSeats);

    await this.cacheManager.set(
      `seat-hold-${user.account_id}`,
      {
        seatIds: seatIds,
        schedule_id: schedule_id,
      },
      { ttl: 600 } as any
    );

    return { msg: 'Seats held successfully' };
  }

  async cancelHoldSeat(data: HoldSeatType, req: { user: JWTUserType }) {
    const user = req.user;
    const { seatIds, schedule_id } = data;
    
    if (seatIds.length === 0) {
      return { msg: 'No seats selected' };
    }

    const cachedHold = await this.cacheManager.get<{
      seatIds: string[];
      schedule_id: number;
    }>(`seat-hold-${user.account_id}`);
    
    if (!cachedHold) {
      throw new BadRequestException('No held seats found for this user');
    }

    if (cachedHold.schedule_id !== schedule_id) {
      throw new BadRequestException('Schedule ID does not match the held seats');
    }

    const invalidSeats = seatIds.filter(id => !cachedHold.seatIds.includes(id));
    if (invalidSeats.length > 0) {
      throw new BadRequestException(`These seats are not held by this user: ${invalidSeats.join(', ')}`);
    }

    const schedule = await this.scheduleRepository.findOne({
      where: { id: schedule_id, is_deleted: false },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    const foundSeats = await this.scheduleSeatRepository.find({
      where: {
        schedule: { id: schedule.id },
        seat: { id: In(seatIds) },
      },
      relations: ['seat', 'schedule'],
    });

    if (foundSeats.length === 0) {
      throw new NotFoundException('No seats found for the given IDs and schedule');
    }

    for (const seat of foundSeats) {
      if (seat.status === SeatStatus.HELD) {
        seat.status = SeatStatus.NOT_YET;
      }
    }

    await this.scheduleSeatRepository.save(foundSeats);
    await this.cacheManager.del(`seat-hold-${user.account_id}`);

    return {
      msg: 'Held seats cancelled successfully',
    };
  }
}
