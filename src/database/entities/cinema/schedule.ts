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
import { ScheduleSeat } from './schedule_seat';
import { Version } from './version';

@Entity('schedule')
export class Schedule {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'datetime', nullable: false })
  start_movie_time: Date;

  @Column({ type: 'datetime', nullable: false })
  end_movie_time: Date;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean; //

  @ManyToOne(() => CinemaRoom, (cinemaRoom) => cinemaRoom.schedules)
  @JoinColumn({ name: 'cinema_room_id' })
  cinemaRoom: CinemaRoom;

  @ManyToOne(() => Movie, (movie) => movie.schedules)
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @ManyToOne(() => Version, { eager: true }) // Liên kết với Version
  @JoinColumn({ name: 'version_id' })
  version: Version;

  @OneToMany(() => Ticket, (ticket) => ticket.schedule)
  tickets: Ticket[];

  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.schedule)
  orderDetails: OrderDetail[];

  @OneToMany(() => ScheduleSeat, (scheduleSeat) => scheduleSeat.schedule)
  scheduleSeats: ScheduleSeat[];
}
