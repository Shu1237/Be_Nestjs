import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Ticket } from '../order/ticket';
import { CinemaRoom } from './cinema-room';
import { SeatType } from './seat-type';
import { ScheduleSeat } from './schedule_seat';

@Entity('seat')
export class Seat {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  @Column({ type: 'varchar', length: 5 })
  seat_row: string;

  @Column({ type: 'varchar', length: 5 })
  seat_column: string;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @ManyToOne(() => SeatType, (seatType) => seatType.seats)
  @JoinColumn({ name: 'seat_type_id' })
  seatType: SeatType;

  @ManyToOne(() => CinemaRoom, (cinemaRoom) => cinemaRoom.seats)
  @JoinColumn({ name: 'cinema_room_id' })
  cinemaRoom: CinemaRoom;

  @OneToMany(() => Ticket, (ticket) => ticket.seat)
  tickets: Ticket[];

  @OneToMany(() => ScheduleSeat, (scheduleSeat) => scheduleSeat.seat)
  scheduleSeats: ScheduleSeat[];
}
