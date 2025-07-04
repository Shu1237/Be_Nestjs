import { Injectable } from '@nestjs/common';
import { Ticket } from 'src/database/entities/order/ticket';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from 'src/database/entities/user/user';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';

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
          version: ticket.schedule.version.name,
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

  async getAllTickets({
    skip,
    take,
    page,
    is_used,
    active,
    search,
    startDate,
    endDate,
  }: {
    skip: number;
    take: number;
    page: number;
    is_used?: boolean;
    active?: boolean;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = this.ticketRepository
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
      .skip(skip)
      .take(take);

    if (search && search.trim() !== '') {
      query.andWhere(`
    (
      movie.name LIKE :search OR
      seatType.seat_type_name LIKE :search OR
      cinemaRoom.cinema_room_name LIKE :search OR
      ticketType.ticket_name LIKE :search
    )
  `, { search: `%${search.trim()}%` });
    }
    if (typeof active === 'boolean') {
      query.andWhere('ticket.status = :active', { active });
    }
    if (typeof is_used === 'boolean') {
      query.andWhere('ticket.is_used = :is_used', { is_used });
    }
    if (startDate && endDate) {
      query.andWhere('order.order_date BETWEEN :start AND :end', {
        start: `${startDate} 00:00:00`,
        end: `${endDate} 23:59:59`,
      });
    } else if (startDate) {
      query.andWhere('order.order_date >= :start', { start: startDate });
    } else if (endDate) {
      query.andWhere('order.order_date <= :end', { end: endDate });
    }


    const [tickets, total] = await query.getManyAndCount();
    const [totalAvailable, totalUsedActive] = await Promise.all([
      this.ticketRepository.count({
        where: {
          status: true,
          is_used: false,
        },
      }),
      this.ticketRepository.count({
        where: {
          status: true,
          is_used: true,
        },
      }),
    ]);
    const summaries = tickets.map((ticket) => this.summaryTicket(ticket));

    return {
      data: summaries,
      total,
      page,
      totalAvailable,
      totalUsedActive,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
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




  async getTicketsByUserId(
    userId: string,
    {
      skip,
      take,
      page,
      is_used,
      active,
      search,
      startDate,
      endDate,
    }: {
      skip: number;
      take: number;
      page: number;
      is_used?: boolean;
      active?: boolean;
      search?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {

    // Kiểm tra user tồn tại
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const query = this.ticketRepository
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
      .where('order.user_id = :userId', { userId })
      .skip(skip)
      .take(take);

    if (search && search.trim() !== '') {
      query.andWhere(`
    (
      movie.name LIKE :search OR
      seatType.seat_type_name LIKE :search OR
      cinemaRoom.cinema_room_name LIKE :search OR
      ticketType.ticket_name LIKE :search
    )
  `, { search: `%${search.trim()}%` });
    }
    if (typeof active === 'boolean') {
      query.andWhere('ticket.status = :active', { active });
    }
    if (typeof is_used === 'boolean') {
      query.andWhere('ticket.is_used = :is_used', { is_used });
    }
    if (startDate && endDate) {
      query.andWhere('order.order_date BETWEEN :start AND :end', {
        start: `${startDate} 00:00:00`,
        end: `${endDate} 23:59:59`,
      });
    } else if (startDate) {
      query.andWhere('order.order_date >= :start', { start: startDate });
    } else if (endDate) {
      query.andWhere('order.order_date <= :end', { end: endDate });
    }


    const [tickets, total] = await query.getManyAndCount();
    const [totalAvailable, totalUsedActive] = await Promise.all([
      this.ticketRepository.count({
        where: {
          status: true,
          is_used: false,
        },
      }),
      this.ticketRepository.count({
        where: {
          status: true,
          is_used: true,
        },
      }),
    ]);
    const summaries = tickets.map((ticket) => this.summaryTicket(ticket));

    return {
      data: summaries,
      total,
      page,
      totalAvailable,
      totalUsedActive,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
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
