
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
import { ScheduleSeat } from 'src/typeorm/entities/cinema/schedule_seat';
import { StatusSeat } from 'src/enum/status_seat.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import Redis from 'ioredis/built/Redis';



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


    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) { }

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

    // const seat = this.seatRepository.create({
    //   ...seatDetails,
    //   status: true,
    //   is_hold: false,
    //   seatType: seatType,
    //   cinemaRoom: cinemaRoom,
    // });
    // await this.seatRepository.save(seat);
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
    // if (seat.is_hold) {
    //   throw new BadRequestException('Cannot delete a seat that is being held');
    // }
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

    // if (seat.is_hold) {
    //   throw new BadRequestException('Cannot update status of a seat that is being held');
    // }

    // Toggle the status
    // await this.seatRepository.update(id, { status: !seat.status });

    // Clear any cached data for this seat
    await this.redisClient.del(`seat-${id}`);

    return { msg: 'Change status successfully' };
  }

  async holdSeat(data: HoldSeatType, req: JWTUserType) {

    const { seatIds, schedule_id } = data;
    const user = req;
    // console.log(`seat-hold-${user.account_id}`);
    if (!seatIds || seatIds.length === 0) {
      throw new BadRequestException('No seats selected');
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

    const checkBookedSeat = foundSeats.filter(seat =>
      seat.status === StatusSeat.BOOKED || seat.status === StatusSeat.HELD
    );
    if (checkBookedSeat.length > 0) {
      throw new BadRequestException(
        `Some seats are already booked or held: ${checkBookedSeat.map(s => s.seat.id).join(', ')}`
      );
    }

    for (const seat of foundSeats) {
      seat.status = StatusSeat.HELD;
    }

    await this.scheduleSeatRepository.save(foundSeats);

    await this.redisClient.set(
      `seat-hold-${user.account_id}`,
      JSON.stringify({
        seatIds: seatIds,
        schedule_id: schedule_id,
      }),
      'EX',
      600
    );
  

    return { msg: 'Seats held successfully' };
  }
  async cancelHoldSeat(data: HoldSeatType, req: JWTUserType) {
    const user = req;
    // console.log(user.account_id)

    const { seatIds, schedule_id } = data;

    if (!seatIds || seatIds.length === 0) {
      throw new BadRequestException('No seats selected');
    }
    // console.log(`seat-hold-${user.account_id}`);
    const redisRaw = await this.redisClient.get(`seat-hold-${user.account_id}`);
    if (!redisRaw) {
      throw new NotFoundException('No held seats found for this user');
    }

    let cachedHold: HoldSeatType;
    try {
      cachedHold = JSON.parse(redisRaw);
    } catch (e) {
      throw new BadRequestException('Invalid cached data format');
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
    // console.log(foundSeats)

    if (foundSeats.length === 0) {
      throw new NotFoundException('No seats found for the given IDs and schedule');
    }

    for (const seat of foundSeats) {
      if (seat.status === StatusSeat.HELD) {
        seat.status = StatusSeat.NOT_YET;
      }
    }

    await this.scheduleSeatRepository.save(foundSeats);

    await this.redisClient.del(`seat-hold-${user.account_id}`);

    return {
      msg: 'Held seats cancelled successfully',
    };
  }


}
