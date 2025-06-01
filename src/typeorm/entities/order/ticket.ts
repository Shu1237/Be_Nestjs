import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Schedule } from "../cinema/schedule";
import { Seat } from "../cinema/seat";
import { OrderDetail } from "./order-detail";
import { TicketType } from "./ticket-type";
import { Movie } from "../cinema/movie";

@Entity('ticket')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: false })
  status: boolean;


  @ManyToOne(() => Schedule, (schedule) => schedule.tickets)
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @ManyToOne(() => Seat, (seat) => seat.tickets)
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;

  @ManyToOne(() => TicketType, (ticketType) => ticketType.tickets)
  @JoinColumn({ name: 'ticket_type_id' })
  ticketType: TicketType;

  @OneToOne(() => OrderDetail, (orderDetail) => orderDetail.ticket)
  orderDetail: OrderDetail;

  @ManyToOne(() => Movie, (movie) => movie.schedules)
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;
}
