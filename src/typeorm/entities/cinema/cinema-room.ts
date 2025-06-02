import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Seat } from './seat';
import { Schedule } from './schedule';


@Entity('cinema_room')
export class CinemaRoom {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', nullable: false, length: 100 })
  cinema_room_name: string;

  @OneToMany(() => Seat, (seat) => seat.cinemaRoom)
  seats: Seat[];

  @OneToMany(() => Schedule, (schedule) => schedule.cinemaRoom)
  schedules: Schedule[];
}