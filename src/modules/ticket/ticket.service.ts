import { Injectable } from '@nestjs/common';
import { Ticket } from 'src/database/entities/order/ticket';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from 'src/database/entities/user/user';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { TicketPaginationDto } from 'src/common/pagination/dto/ticket/ticket-pagination.dto';
import { applyCommonFilters } from 'src/common/pagination/applyCommonFilters';
import { ticketFieldMapping } from 'src/common/pagination/fillters/ticket-field-mapping';
import { buildPaginationResponse } from 'src/common/pagination/pagination-response';
import { applySorting } from 'src/common/pagination/apply_sort';
import { applyPagination } from 'src/common/pagination/applyPagination';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket) private ticketRepository: Repository<Ticket>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) { }
  private summaryTicket(ticket: Ticket) {
    return {
      id: ticket.id,
      is_used: ticket.is_used,
      status: ticket.status,
      ticketType: {
        id: ticket.ticketType.id,
        name: ticket.ticketType.ticket_name,
        audience_type: ticket.ticketType.audience_type,
      },
      schedule: {
        start_movie_time: ticket.schedule.start_movie_time,
        end_movie_time: ticket.schedule.end_movie_time,
        movie: {
          id: ticket.schedule.movie.id,
          name: ticket.schedule.movie.name,
          duration: ticket.schedule.movie.duration,
          thumbnail: ticket.schedule.movie.thumbnail,
        },
        version: {
          id: ticket.schedule.version.id,
          name: ticket.schedule.version.name,
        },
        cinemaRoom: {
          id: ticket.schedule.cinemaRoom.id,
          name: ticket.schedule.cinemaRoom.cinema_room_name,
        },
      },
      seat: {
        id: ticket.seat.id,
        row: ticket.seat.seat_row,
        column: ticket.seat.seat_column,
      },
      seat_type: {
        id: ticket.seat.seatType.id,
        name: ticket.seat.seatType.seat_type_name,
      }
    };
  }

  async getAllTickets(fillters: TicketPaginationDto) {
    const qb = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.schedule', 'schedule')
      .leftJoinAndSelect('schedule.movie', 'movie')
      .leftJoinAndSelect('schedule.version', 'version')
      .leftJoinAndSelect('schedule.cinemaRoom', 'cinemaRoom')
      .leftJoinAndSelect('ticket.seat', 'seat')
      .leftJoinAndSelect('seat.seatType', 'seatType')
      .leftJoinAndSelect('ticket.ticketType', 'ticketType')
      .leftJoinAndSelect('ticket.orderDetail', 'orderDetail')
      .leftJoinAndSelect('orderDetail.order', 'order')



    applyCommonFilters(qb, fillters, ticketFieldMapping);

    const allowedSortFields = [
      'schedule.id',
      'ticketType.id',
      'ticket.is_used',
      'ticket.status',
    ];
    applySorting(
      qb,
      fillters.sortBy,
      fillters.sortOrder,
      allowedSortFields,
      'schedule.id',
    );


    applyPagination(qb, {
      page: fillters.page,
      take: fillters.take,
    });
    const [tickets, total] = await qb.getManyAndCount();
    const summaries = tickets.map((ticket) => this.summaryTicket(ticket));

    const result = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select([
        `SUM(CASE WHEN ticket.status = true AND ticket.is_used = false THEN 1 ELSE 0 END) AS totalAvailable`,
        `SUM(CASE WHEN ticket.status = true AND ticket.is_used = true THEN 1 ELSE 0 END) AS totalUsedActive`,
      ])
      .getRawOne<{ totalAvailable: string; totalUsedActive: string }>();

    const totalAvailable = parseInt(result?.totalAvailable || '0', 10);
    const totalUsedActive = parseInt(result?.totalUsedActive || '0', 10);
    return buildPaginationResponse(
      summaries,
      {
        total,
        page: fillters.page,
        take: fillters.take,
        totalAvailable,
        totalUsedActive,
      }

    );
  }



  async getTicketById(id: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['schedule', 'schedule.movie', 'schedule.cinemaRoom', 'seat', 'seat.seatType', 'ticketType']
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
    return this.summaryTicket(ticket);
  }




  async getTicketsByUserId(fillters: TicketPaginationDto & { userId: string }) {
    const qb = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.schedule', 'schedule')
      .leftJoinAndSelect('schedule.movie', 'movie')
      .leftJoinAndSelect('schedule.version', 'version')
      .leftJoinAndSelect('schedule.cinemaRoom', 'cinemaRoom')
      .leftJoinAndSelect('ticket.seat', 'seat')
      .leftJoinAndSelect('seat.seatType', 'seatType')
      .leftJoinAndSelect('ticket.ticketType', 'ticketType')
      .leftJoinAndSelect('ticket.orderDetail', 'orderDetail')
      .leftJoinAndSelect('orderDetail.order', 'order')
      .where('order.user_id = :userId', { userId: fillters.userId });



    applyCommonFilters(qb, fillters, ticketFieldMapping);

    const allowedSortFields = [
      'schedule.id',
      'ticketType',
      'ticket.is_used',
      'ticket.status',
      'movie.name',
      'version.name',
    ];
    applySorting(
      qb,
      fillters.sortBy,
      fillters.sortOrder,
      allowedSortFields,
      'schedule.id',
    );


    applyPagination(qb, {
      page: fillters.page,
      take: fillters.take,
    });
    const [tickets, total] = await qb.getManyAndCount();
    const summaries = tickets.map((ticket) => this.summaryTicket(ticket));

    const result = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select([
        `SUM(CASE WHEN ticket.status = true AND ticket.is_used = false THEN 1 ELSE 0 END) AS totalAvailable`,
        `SUM(CASE WHEN ticket.status = true AND ticket.is_used = true THEN 1 ELSE 0 END) AS totalUsedActive`,
      ])
      .getRawOne<{ totalAvailable: string; totalUsedActive: string }>();

    const totalAvailable = parseInt(result?.totalAvailable || '0', 10);
    const totalUsedActive = parseInt(result?.totalUsedActive || '0', 10);
    return buildPaginationResponse(
      summaries,
      {
        total,
        page: fillters.page,
        take: fillters.take,
        totalAvailable,
        totalUsedActive,
      }

    );



  }



  async markTicketsAsUsed(ticketIds: string[]) {
    const tickets = await this.ticketRepository.find({
      where: { id: In(ticketIds), is_used: false },
    });
    if (tickets.length === 0) {
      throw new NotFoundException('No tickets found for the provided IDs or all tickets are already used.');
    }
    const foundTicketIds = tickets.map(ticket => ticket.id);
    const usedTicketIds = ticketIds.filter(id => !foundTicketIds.includes(id));
    if (usedTicketIds.length > 0) {
      throw new BadRequestException(`Tickets with IDs ${usedTicketIds.join(', ')} are already used or invalid.`);
    }
    for (const ticket of tickets) {
      ticket.is_used = true;
    }
    await this.ticketRepository.save(tickets);
  }
}
