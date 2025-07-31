import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Schedule } from './schedule';
import { Seat } from './seat';
import { StatusSeat } from 'src/common/enums/status_seat.enum';

@Entity('schedule_seat')
export class ScheduleSeat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'tinyint', default: StatusSeat.NOT_YET })
  status: number;

  @ManyToOne(() => Schedule, (schedule) => schedule.scheduleSeats)
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @ManyToOne(() => Seat, (seat) => seat.scheduleSeats)
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;
}
