import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { CinemaRoom } from './cinema-room';
import { Movie } from './movie';
import { OrderDetail } from '../order/order-detail';
import { Ticket } from '../order/ticket';

@Entity('schedule') 
export class Schedule {
  @PrimaryGeneratedColumn({ type: 'int' }) 
  id: number;

  @Column({ type: 'int', nullable: false })
  cinema_room_id: number;

  @Column({ type: 'int', nullable: false })
  movie_id: number;

  @Column({ type: 'datetime', nullable: false })
  show_date: Date;


  @ManyToOne(() => CinemaRoom, (cinemaRoom) => cinemaRoom.schedules)
  @JoinColumn({ name: 'cinema_room_id' })
  cinemaRoom: CinemaRoom;


  @ManyToOne(() => Movie, (movie) => movie.schedules)
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;


  @OneToMany(() => Ticket, (ticket) => ticket.schedule)
  tickets: Ticket[];

  
  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.schedule)
  orderDetails: OrderDetail[];
}
