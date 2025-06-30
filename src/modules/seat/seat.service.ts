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
    const { sections, seat_column, cinema_room_id } = dto;
    const roomId = parseInt(cinema_room_id);

    // Parallel validation
    const [cinemaRoom, seatTypes] = await Promise.all([
      this.cinemaRoomRepository.findOne({ where: { id: roomId } }),
      this.seatTypeRepository.find({
        where: { id: In(sections.map((s) => s.seat_type_id)) },
      }),
    ]);

    if (!cinemaRoom) throw new NotFoundException('Cinema room not found');

    const seatTypeIds = new Set(sections.map((s) => s.seat_type_id));
    if (seatTypes.length !== seatTypeIds.size) {
      throw new NotFoundException('Some seat types not found');
    }

    // Use Map for O(1) lookup
    const seatTypeMap = new Map(seatTypes.map((st) => [st.id, st]));

    // Pre-allocate arrays với estimated size
    const estimatedSize = sections.reduce(
      (sum, section) =>
        sum +
        (section.seat_rows
          ? section.seat_rows * seat_column
          : section.seat_ids?.length || 0),
      0,
    );

    const allSeatIds: string[] = new Array<string>(estimatedSize).fill(''); // Pre-allocate
    const layout: { type: number; seat: string[][] }[] = [];
    const seatMap = new Map<
      string,
      { row: string; col: string; seatType: SeatType }
    >();

    let seatIndex = 0;
    let currentRow = 0;

    // Single loop processing
    for (const section of sections) {
      const seatType = seatTypeMap.get(section.seat_type_id)!;

      if (section.seat_rows) {
        const sectionLayout: string[][] = [];
        const endRow = currentRow + section.seat_rows;

        for (let row = currentRow; row < endRow; row++) {
          const rowChar = String.fromCharCode(65 + row);
          const rowSeats: string[] = Array.from(
            { length: seat_column },
            () => '',
          ); // Pre-allocate with empty strings

          for (let col = 0; col < seat_column; col++) {
            const seatId = `${rowChar}${col + 1}`;
            allSeatIds[seatIndex++] = seatId;
            rowSeats[col] = seatId;
            seatMap.set(seatId, {
              row: rowChar,
              col: (col + 1).toString(),
              seatType,
            });
          }
          sectionLayout.push(rowSeats);
        }
        layout.push({ type: section.seat_type_id, seat: sectionLayout });
        currentRow = endRow;
      }

      if (section.seat_ids?.length) {
        const rowMap = new Map<string, string[]>();

        for (const seatId of section.seat_ids) {
          allSeatIds[seatIndex++] = seatId;
          const rowChar = seatId[0];
          const col = seatId.substring(1);

          seatMap.set(seatId, { row: rowChar, col, seatType });

          if (!rowMap.has(rowChar)) rowMap.set(rowChar, []);
          rowMap.get(rowChar)!.push(seatId);
        }

        layout.push({
          type: section.seat_type_id,
          seat: Array.from(rowMap.values()),
        });
      }
    }

    // Trim array to actual size
    allSeatIds.length = seatIndex;

    // Batch check existing seats
    const existingSeats = await this.seatRepository.find({
      where: { id: In(allSeatIds), cinemaRoom: { id: roomId } },
      select: ['id'],
    });

    const existingSeatIds = new Set(existingSeats.map((seat) => seat.id));

    // Batch create new seats
    const seatsToCreate = allSeatIds
      .filter((seatId) => !existingSeatIds.has(seatId))
      .map((seatId) => {
        const seatData = seatMap.get(seatId)!;
        return {
          id: seatId,
          seat_row: seatData.row,
          seat_column: seatData.col,
          is_deleted: false,
          seatType: seatData.seatType,
          cinemaRoom,
        };
      });

    // Use batch insert for better performance
    if (seatsToCreate.length > 0) {
      await this.seatRepository
        .createQueryBuilder()
        .insert()
        .into(Seat)
        .values(seatsToCreate)
        .execute();
    }

    return {
      message: 'Seats created successfully',
      cinema_room_id,
      created: seatsToCreate.length,
      existed: existingSeatIds.size,
      total: allSeatIds.length,
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
