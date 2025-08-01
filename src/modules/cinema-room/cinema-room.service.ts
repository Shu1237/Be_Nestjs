import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CinemaRoom } from '../../database/entities/cinema/cinema-room';
import { CreateCinemaRoomDto } from './dto/create-cinema-room.dto';
import { UpdateCinemaRoomDto } from './dto/update-cinema-room.dto';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { CinemaRoomPaginationDto } from 'src/common/pagination/dto/cinmeroom/cinmearoomPagiantion.dto';
import { applyCommonFilters } from 'src/common/pagination/applyCommonFilters';
import { cinemaRoomFieldMapping } from 'src/common/pagination/fillters/cinmeroom-field-mapping';
import { applySorting } from 'src/common/pagination/apply_sort';
import { applyPagination } from 'src/common/pagination/applyPagination';
import { buildPaginationResponse } from 'src/common/pagination/pagination-response';


@Injectable()
export class CinemaRoomService {
  constructor(
    @InjectRepository(CinemaRoom)
    private readonly cinemaRoomRepository: Repository<CinemaRoom>,
  ) {}

  async getAllCinemaRoomsUser(): Promise<CinemaRoom[]> {
    try {
      return await this.cinemaRoomRepository.find({
        where: { is_deleted: false },
      });
    } catch (error) {
      throw error;
    }
  }

  async create(
    createCinemaRoomDto: CreateCinemaRoomDto,
  ): Promise<{ message: string }> {
    if (!createCinemaRoomDto) {
      throw new BadRequestException('Create cinema room DTO is required');
    }

    const trimmedName = createCinemaRoomDto.cinema_room_name?.trim();
    if (!trimmedName) {
      throw new BadRequestException('Cinema room name is required');
    }

    const existing = await this.cinemaRoomRepository.findOne({
      where: { cinema_room_name: trimmedName },
    });
    if (existing) {
      throw new BadRequestException('The cinema room name already exists');
    }

    const cinemaRoom = this.cinemaRoomRepository.create({
      ...createCinemaRoomDto,
      cinema_room_name: trimmedName,
    });
    await this.cinemaRoomRepository.save(cinemaRoom);
    return {
      message: 'Cinema room created successfully',
    };
  }

  async findAll(filters: CinemaRoomPaginationDto) {
    if (!filters) {
      throw new BadRequestException('Filters are required');
    }

    const qb = this.cinemaRoomRepository.createQueryBuilder('cinemaRoom');
    applyCommonFilters(qb, filters, cinemaRoomFieldMapping);
    const allowedSortFields = ['cinemaRoom.id', 'cinemaRoom.cinema_room_name'];
    applySorting(
      qb,
      filters.sortBy,
      filters.sortOrder,
      allowedSortFields,
      'cinemaRoom.id',
    );

    applyPagination(qb, {
      take: filters.take,
      page: filters.page,
    });
    const [cinemaRooms, total] = await qb.getManyAndCount();
    const countResult: { activeCount: number; deletedCount: number } = await this.cinemaRoomRepository
      .createQueryBuilder('cinemaRoom')
      .select([
        `SUM(CASE WHEN cinemaRoom.is_deleted = false THEN 1 ELSE 0 END) AS activeCount`,
        `SUM(CASE WHEN cinemaRoom.is_deleted = true THEN 1 ELSE 0 END) AS deletedCount`,
      ])
      .getRawOne() || { activeCount: 0, deletedCount: 0 };

    const activeCount = Number(countResult?.activeCount) || 0;
    const deletedCount = Number(countResult?.deletedCount) || 0;
    return buildPaginationResponse(cinemaRooms, {
      total,
      page: filters.page,
      take: filters.take,
      activeCount,
      deletedCount,
    });
  }

  async findOne(id: number): Promise<CinemaRoom> {
    if (
      id === null ||
      id === undefined ||
      isNaN(id) ||
      typeof id !== 'number'
    ) {
      throw new BadRequestException('Valid ID is required');
    }

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
  ): Promise<{ message: string }> {
    if (!updateCinemaRoomDto) {
      throw new BadRequestException('Update cinema room DTO is required');
    }

    const trimmedName = updateCinemaRoomDto.cinema_room_name?.trim();
    if (!trimmedName) {
      throw new BadRequestException('Cinema room name is required');
    }

    const existing = await this.cinemaRoomRepository.findOne({
      where: { cinema_room_name: trimmedName },
    });
    if (existing && existing.id !== id) {
      throw new BadRequestException('The cinema room name already exists');
    }

    const cinemaRoom = await this.findOne(id);
    Object.assign(cinemaRoom, {
      ...updateCinemaRoomDto,
      cinema_room_name: trimmedName,
    });
    await this.cinemaRoomRepository.save(cinemaRoom);
    return {
      message: 'Cinema room updated successfully',
    };
  }

  async remove(id: number): Promise<{ msg: string }> {
    if (
      id === null ||
      id === undefined ||
      isNaN(id) ||
      typeof id !== 'number'
    ) {
      throw new BadRequestException('Valid ID is required');
    }

    const cinemaRoom = await this.cinemaRoomRepository.findOne({
      where: { id },
      relations: ['schedules', 'schedules.tickets'],
    });
    if (!cinemaRoom) {
      throw new NotFoundException(`Cinema room with ID ${id} not found`);
    }
    // check tất cả schedule đc mua trong tương lai
    const hasFutureTickets = cinemaRoom.schedules.some(schedule =>
      schedule.tickets.some(ticket => ticket.status && schedule.start_movie_time > new Date()),
    );
    if (hasFutureTickets) {
      throw new BadRequestException('Cannot delete cinema room with future tickets');
    }

    await this.cinemaRoomRepository.remove(cinemaRoom);
    return { msg: 'Cinema room deleted successfully' };
  }

  async softDeleteCinemaRoom(
    id: number,
  ) : Promise<{ msg: string}>{
    if (
      id === null ||
      id === undefined ||
      isNaN(id) ||
      typeof id !== 'number'
    ) {
      throw new BadRequestException('Valid ID is required');
    }

    const cinemaRoom = await this.cinemaRoomRepository.findOne({
      where: { id },
      relations: ['schedules', 'schedules.tickets'],
    });
    if (!cinemaRoom) {
      throw new NotFoundException(`Cinema Room with ID ${id} not found`);
    }
    // check tất cả schedule đc mua trong tương lai
    const hasFutureTickets = cinemaRoom.schedules.some(schedule =>
      schedule.tickets.some(ticket => ticket.status && schedule.start_movie_time > new Date()),
    );
    if (hasFutureTickets) {
      throw new BadRequestException('Cannot delete cinema room with future tickets');
    }

    cinemaRoom.is_deleted = true;
    await this.cinemaRoomRepository.save(cinemaRoom);

    return  { msg: 'Cinema Room soft-deleted successfully' };
  }

  async restoreCinemaRoom(
    id: number,
  ): Promise<{ msg: string; cinemaRoom: CinemaRoom }> {
    if (
      id === null ||
      id === undefined ||
      isNaN(id) ||
      typeof id !== 'number'
    ) {
      throw new BadRequestException('Valid ID is required');
    }

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
