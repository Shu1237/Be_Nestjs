import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Seat } from 'src/database/entities/cinema/seat';
import { HoldSeatType, JWTUserType } from 'src/common/utils/type';
import { In, Repository } from 'typeorm';
import { SeatType } from 'src/database/entities/cinema/seat-type';
import { CinemaRoom } from 'src/database/entities/cinema/cinema-room';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { StatusSeat } from 'src/common/enums/status_seat.enum';
import Redis from 'ioredis/built/Redis';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { BulkCreateSeatDto } from './dto/BulkCreateSeatDto';
import { SeatPaginationDto } from 'src/common/pagination/dto/seat/seatPagination.dto';
import { applyCommonFilters } from 'src/common/pagination/applyCommonFilters';
import { seatFieldMapping } from 'src/common/pagination/fillters/seat-filed-mapping';
import { applySorting } from 'src/common/pagination/apply_sort';
import { applyPagination } from 'src/common/pagination/applyPagination';
import { buildPaginationResponse } from 'src/common/pagination/pagination-response';
import { BulkSeatOperationDto } from './dto/BulkSeatOperationDto';
import { BulkSeatIdsDto } from './dto/BulkSeatIdsDto';

@Injectable()
export class SeatService {
  constructor(
    @InjectRepository(Seat) private seatRepository: Repository<Seat>,
    @InjectRepository(SeatType)
    private seatTypeRepository: Repository<SeatType>,
    @InjectRepository(CinemaRoom)
    private cinemaRoomRepository: Repository<CinemaRoom>,
    @InjectRepository(ScheduleSeat)
    private scheduleSeatRepository: Repository<ScheduleSeat>,

    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  private getSeatSummary(seat: Seat) {
    return {
      id: seat.id,
      seat_row: seat.seat_row,
      seat_column: seat.seat_column,
      is_deleted: seat.is_deleted,
      seatType: {
        id: seat.seatType?.id,
        name: seat.seatType?.seat_type_name,
      },
      cinemaRoom: {
        id: seat.cinemaRoom?.id,
        name: seat.cinemaRoom?.cinema_room_name,
      },
    };
  }
  async getAllSeatsUser(): Promise<Seat[]> {
    return await this.seatRepository.find({
      where: { is_deleted: false },
      relations: ['seatType', 'cinemaRoom'],
    });
  }

  async getAllSeats(fillters: SeatPaginationDto) {
    const qb = this.seatRepository
      .createQueryBuilder('seat')
      .leftJoinAndSelect('seat.seatType', 'seatType')
      .leftJoinAndSelect('seat.cinemaRoom', 'cinemaRoom');

    applyCommonFilters(qb, fillters, seatFieldMapping);
    const allowedFields = [
      'seat.seat_row',
      'seat.seat_column',
      'seatType.seat_type_name',
      'cinemaRoom.cinema_room_name',
      'cinemaRoom.id',
    ];
    applySorting(
      qb,
      fillters.sortBy,
      fillters.sortOrder,
      allowedFields,
      'seat.seat_row',
    );

    applyPagination(qb, {
      page: fillters.page,
      take: fillters.take,
    });
    const [seats, total] = await qb.getManyAndCount();
    const seatSummaries = seats.map((seat) => this.getSeatSummary(seat));
    const counts = await this.seatRepository
      .createQueryBuilder('seat')
      .select([
        `SUM(CASE WHEN seat.is_deleted = false THEN 1 ELSE 0 END) AS activeCount`,
        `SUM(CASE WHEN seat.is_deleted = true THEN 1 ELSE 0 END) AS deletedCount`,
      ])
      .getRawOne();

    const activeCount =
      parseInt(counts?.activeCount?.toString() || '0', 10) || 0;
    const deletedCount =
      parseInt(counts?.deletedCount?.toString() || '0', 10) || 0;

    return buildPaginationResponse(seatSummaries, {
      total,
      page: fillters.page,
      take: fillters.take,
      activeCount,
      deletedCount,
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
  async restoreSeat(id: string) {
    const seat = await this.seatRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['seatType', 'cinemaRoom'],
    });

    if (!seat) {
      const deletedSeat = await this.seatRepository.findOne({
        where: { id },
        relations: ['seatType', 'cinemaRoom'],
      });

      if (!deletedSeat) {
        throw new NotFoundException('Seat not found');
      }

      if (!deletedSeat.is_deleted) {
        throw new BadRequestException('Seat is not soft-deleted');
      }

      deletedSeat.is_deleted = false;
      await this.seatRepository.save(deletedSeat);
      return { msg: 'Seat restored successfully' };
    }

    throw new BadRequestException('Seat is not soft-deleted');
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
  // Shared validation helper
  private async validateSeatsExist(
    seatIds: string[],
    shouldExist: boolean = true,
  ) {
    const existingSeats = await this.seatRepository.find({
      where: { id: In(seatIds), is_deleted: false },
      select: ['id'],
    });

    const foundIds = existingSeats.map((s) => s.id);
    const missingIds = seatIds.filter((id) => !foundIds.includes(id));

    if (shouldExist && missingIds.length > 0) {
      throw new NotFoundException(`Seats not found: ${missingIds.join(', ')}`);
    }
    if (!shouldExist && foundIds.length > 0) {
      throw new BadRequestException(
        `Seats already exist: ${foundIds.join(', ')}`,
      );
    }

    return { foundIds, missingIds };
  }

  // Shared entity validation
  private async validateRelatedEntities(
    seatTypeIds: number[],
    roomIds: number[],
  ) {
    const [seatTypes, rooms] = await Promise.all([
      seatTypeIds.length
        ? this.seatTypeRepository.find({ where: { id: In(seatTypeIds) } })
        : Promise.resolve([]),
      roomIds.length
        ? this.cinemaRoomRepository.find({ where: { id: In(roomIds) } })
        : Promise.resolve([]),
    ]);

    const seatTypeMap = new Map<number, SeatType>();
    const roomMap = new Map<number, CinemaRoom>();

    seatTypes.forEach((st) => seatTypeMap.set(st.id, st));
    rooms.forEach((r) => roomMap.set(r.id, r));

    return { seatTypeMap, roomMap };
  }
  async createSeatsBulk(dto: BulkCreateSeatDto) {
    const { sections, seat_column, cinema_room_id } = dto;
    const roomId = parseInt(cinema_room_id);

    // Validate entities
    const seatTypeIds = [...new Set(sections.map((s) => s.seat_type_id))];
    const { seatTypeMap, roomMap } = await this.validateRelatedEntities(
      seatTypeIds,
      [roomId],
    );

    if (!roomMap.has(roomId))
      throw new NotFoundException('Cinema room not found');
    if (seatTypeMap.size !== seatTypeIds.length)
      throw new NotFoundException('Some seat types not found');

    // Generate seat data
    const seatsToCreate: Partial<Seat>[] = [];
    let currentRow = 0;

    for (const section of sections) {
      const seatType = seatTypeMap.get(section.seat_type_id)!;
      const seatIds: string[] = [];

      // Generate from rows or use provided IDs
      if (section.seat_rows) {
        for (
          let row = currentRow;
          row < currentRow + section.seat_rows;
          row++
        ) {
          const rowChar = String.fromCharCode(65 + row);
          for (let col = 1; col <= seat_column; col++) {
            seatIds.push(`${rowChar}${col}`);
          }
        }
        currentRow += section.seat_rows;
      } else {
        seatIds.push(...(section.seat_ids || []));
      }

      // Create seat entities
      seatIds.forEach((originalId) => {
        const uniqueId = `R${roomId}_${originalId}`;
        seatsToCreate.push({
          id: uniqueId,
          seat_row: originalId[0],
          seat_column: originalId.substring(1),
          is_deleted: false,
          seatType,
          cinemaRoom: roomMap.get(roomId)!,
        });
      });
    }

    // Validate no duplicates
    const uniqueIds: string[] = seatsToCreate.map((s) => s.id as string);
    await this.validateSeatsExist(uniqueIds, false);

    // Insert
    await this.seatRepository.insert(seatsToCreate);
    return { success: true, created_count: seatsToCreate.length };
  }
  async bulkUpdateSeats(dto: BulkSeatOperationDto) {
    const { seat_ids, updates } = dto;
    if (!seat_ids?.length)
      throw new BadRequestException('No seat IDs provided');

    // Validate seats exist
    const { foundIds } = await this.validateSeatsExist(seat_ids);

    // Build update data
    const updateData: Partial<Seat> = {};
    const entityIds: number[] = [];

    if (updates.seat_row) updateData.seat_row = updates.seat_row;
    if (updates.seat_column) updateData.seat_column = updates.seat_column;
    if (updates.seat_type_id) entityIds.push(parseInt(updates.seat_type_id));
    if (updates.cinema_room_id)
      entityIds.push(parseInt(updates.cinema_room_id));

    // Validate related entities if needed
    if (entityIds.length) {
      const { seatTypeMap, roomMap } = await this.validateRelatedEntities(
        updates.seat_type_id ? [parseInt(updates.seat_type_id)] : [],
        updates.cinema_room_id ? [parseInt(updates.cinema_room_id)] : [],
      );

      if (
        updates.seat_type_id &&
        !seatTypeMap.has(parseInt(updates.seat_type_id))
      ) {
        throw new NotFoundException('Seat type not found');
      }
      if (
        updates.cinema_room_id &&
        !roomMap.has(parseInt(updates.cinema_room_id))
      ) {
        throw new NotFoundException('Cinema room not found');
      }

      if (updates.seat_type_id)
        updateData.seatType = seatTypeMap.get(parseInt(updates.seat_type_id))!;
      if (updates.cinema_room_id)
        updateData.cinemaRoom = roomMap.get(parseInt(updates.cinema_room_id))!;
    }

    // Execute update
    const result = await this.seatRepository.update(
      { id: In(foundIds) },
      updateData,
    );
    return { success: true, updated_count: result.affected || 0 };
  }
  async bulkDeleteSeats(dto: BulkSeatIdsDto) {
    const { seat_ids, room_id } = dto;
    if (!seat_ids?.length)
      throw new BadRequestException('No seat IDs provided');
    // Build where condition
    const whereCondition: {
      id: any;
      cinemaRoom?: { id: number };
    } = {
      id: In(seat_ids),
    };

    if (room_id) {
      whereCondition.cinemaRoom = { id: parseInt(room_id) };
    }
    // Get valid seats (bao gồm cả seats đã bị soft delete)
    const existingSeats = await this.seatRepository.find({
      where: whereCondition,
      select: ['id'],
    });

    if (!existingSeats.length) {
      throw new NotFoundException('No seats found to delete');
    }
    const validIds = existingSeats.map((s) => s.id);
    // Execute hard delete
    const result = await this.seatRepository.delete({
      id: In(validIds),
    });
    return {
      success: true,
      deleted_count: result.affected || 0,
      deleted_seat_ids: validIds,
      message: 'Seats deleted successfully',
    };
  }
}
