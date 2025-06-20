
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
  private async getScheduleSeats(scheduleId: number, seatIds: string[]): Promise<ScheduleSeat[]> {
    const scheduleSeats = await this.scheduleSeatRepository.find({
      where: {
        schedule: { id: scheduleId },
        seat: { id: In(seatIds) },
        status: StatusSeat.NOT_YET,
      },
    });
    if (!scheduleSeats || scheduleSeats.length === 0) {
      throw new NotFoundException(`No available seats found for schedule ID ${scheduleId} or seats booked`);
    }
    return scheduleSeats;
  }


  async holdSeat(data: HoldSeatType, req: JWTUserType): Promise<void> {
    const { seatIds, schedule_id } = data;
    const user = req;

    if (!seatIds || seatIds.length === 0) {
      throw new BadRequestException('No seats selected');
    }

    const seats = await this.getScheduleSeats(schedule_id, seatIds);
    if (seats.length !== seatIds.length) {
      throw new NotFoundException('Some selected seats are not available');
    }

    const redisKey = `seat-hold-${schedule_id}-${user.account_id}`;

    try {
      await this.redisClient.set(
        redisKey,
        JSON.stringify({ seatIds, schedule_id }),
        'EX',
        600,
      );
    } catch (error) {
      throw new BadRequestException('Failed to hold seats');
    }
  }

  async cancelHoldSeat(data: HoldSeatType, req: JWTUserType): Promise<void> {
    const { schedule_id } = data;
    const user = req;

    const redisKey = `seat-hold-${schedule_id}-${user.account_id}`;
    const redisRaw = await this.redisClient.get(redisKey);

    if (!redisRaw) {
      throw new NotFoundException('No held seats found for this schedule');
    }

    await this.redisClient.del(redisKey);
  }





}
