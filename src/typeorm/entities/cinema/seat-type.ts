import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Seat } from './seat';

@Entity('seat_type')
export class SeatType {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', nullable: false, length: 100 })
  seat_type_name: string;

  @Column({ type: 'decimal', nullable: false })
  seat_type_price: number;

  @Column({ type: 'text', nullable: true })
  seat_type_description?: string;

  @OneToMany(() => Seat, (seat) => seat.seatType)
  seats: Seat[];
}
