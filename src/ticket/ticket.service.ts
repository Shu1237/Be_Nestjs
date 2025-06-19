import { Injectable } from '@nestjs/common';
import { Ticket } from 'src/typeorm/entities/order/ticket';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from 'src/typeorm/entities/user/user';

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
    };
  }

  async getAllTickets() {
    const tickets = await this.ticketRepository.find({
      relations: ['schedule', 'schedule.movie', 'schedule.cinemaRoom', 'seat', 'seat.seatType', 'ticketType'],
    });
    return tickets.map(ticket => this.summaryTicket(ticket));
  }

  async getTicketById(id: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['schedule', 'schedule.movie', 'schedule.cinemaRoom', 'seat', 'seat.seatType', 'ticketType']
    });
    if (!ticket) {
      throw new Error(`Ticket with ID ${id} not found`);
    }
    return this.summaryTicket(ticket);
  }




  private mapTicketByUser(user: User) {
    return {
      id: user.id,
      name: user.username,
      email: user.email,
      tickets: user.orders.flatMap(order =>
        order.orderDetails.map(detail => {
          const ticket = detail.ticket;
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
          };
        })
      )
    };
  }

  async getTicketsByUserId(userId: string) {
    const tickets = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['orders',
        'orders.orderDetails.ticket',
        'orders.orderDetails.ticket.ticketType',
        'orders.orderDetails.ticket.schedule',
        'orders.orderDetails.ticket.schedule.movie',
        'orders.orderDetails.ticket.schedule.cinemaRoom',
        'orders.orderDetails.ticket.seat',
        'orders.orderDetails.ticket.seat.seatType',
      ]
    });
    if (!tickets) {
      throw new Error(`User with ID ${userId} not found`);
    }
    return this.mapTicketByUser(tickets)

  }


  async markTicketsAsUsed(ticketIds: string[]) {
    const tickets = await this.ticketRepository.find({
      where: { id: In(ticketIds) },
    });
    if (tickets.length === 0) {
      throw new Error('No tickets found for the provided IDs');
    }
    for (const ticket of tickets) {
      ticket.is_used = true;
    }
    await this.ticketRepository.save(tickets);
    return {
      msg: 'Tickets marked as used successfully',
    };
  }
}

