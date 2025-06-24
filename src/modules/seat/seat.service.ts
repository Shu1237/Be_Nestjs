import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Seat } from 'src/database/entities/cinema/seat';
import { HoldSeatType, JWTUserType } from 'src/common/utils/type';
import { In, Repository } from 'typeorm';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { SeatType } from 'src/database/entities/cinema/seat-type';
import { CinemaRoom } from 'src/database/entities/cinema/cinema-room';
import { Schedule } from 'src/database/entities/cinema/schedule';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { StatusSeat } from 'src/common/enums/status_seat.enum';
import Redis from 'ioredis/built/Redis';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { BulkCreateSeatDto } from './dto/BulkCreateSeatDto';

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
  async createSeatsBulk(dto: BulkCreateSeatDto) {
    const { seat_rows, seat_column } = dto;

    // 🔸 Gán mặc định loại ghế "thường"
    const defaultSeatType = await this.seatTypeRepository.findOne({
      where: { id: 1 }, // Hoặc: where: { id: 1 }
    });

    if (!defaultSeatType) {
      throw new NotFoundException(
        'Loại ghế mặc định "Ghế thường" không tồn tại',
      );
    }
    // Ma trận kết quả trả về (2D layout)
    const layout: { id: string; seat_row: string; seat_column: string }[][] =
      [];

    // Danh sách ghế cần lưu vào DB
    const seatsToCreate: Seat[] = [];

    // Danh sách ID để check trùng
    const ids: string[] = [];

    for (let y = 0; y < seat_rows; y++) {
      const rowChar = String.fromCharCode(65 + y); // A, B, C...
      const row: { id: string; seat_row: string; seat_column: string }[] = [];

      for (let x = 0; x < seat_column; x++) {
        const col = (x + 1).toString(); // 1 → n
        const id = `${rowChar}${col}`;

        ids.push(id);
        row.push({ id, seat_row: rowChar, seat_column: col });
      }

      layout.push(row);
    }

    // Kiểm tra ghế đã tồn tại chưa
    const existingIds = new Set(
      (await this.seatRepository.findBy({ id: In(ids) })).map((s) => s.id),
    );

    for (const row of layout) {
      for (const s of row) {
        if (!existingIds.has(s.id)) {
          const seatData: Partial<Seat> = {
            id: s.id,
            seat_row: s.seat_row,
            seat_column: s.seat_column,
            is_deleted: false,
            seatType: defaultSeatType, // ✅ Gắn mặc định ở đây
            // cinemaRoom: null,
          };

          seatsToCreate.push(this.seatRepository.create(seatData));
        }
      }
    }

    if (seatsToCreate.length) {
      await this.seatRepository.save(seatsToCreate);
    }

    return {
      msg: 'Create Seat Successfully',
      total: seatsToCreate.length,
      duplicate: ids.length - seatsToCreate.length,
      layout,
    };
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
  private async getScheduleSeats(
    scheduleId: number,
    seatIds: string[],
  ): Promise<ScheduleSeat[]> {
    const scheduleSeats = await this.scheduleSeatRepository.find({
      where: {
        schedule: { id: scheduleId },
        seat: { id: In(seatIds) },
        status: StatusSeat.NOT_YET,
      },
    });
    if (!scheduleSeats || scheduleSeats.length === 0) {
      throw new NotFoundException(
        `No available seats found for schedule ID ${scheduleId} or seats booked`,
      );
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
