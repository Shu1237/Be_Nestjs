import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { Schedule } from "../cinema/schedule";
import { Order } from "./order";
import { Ticket } from "./ticket";

@Entity('order_detail')
export class OrderDetail {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  order_id: number;

  @Column({ type: 'varchar', length: 36 })
  ticket_id: string;

  @Column({ type: 'int' })
  schedule_id: number;

  @Column({ type: 'decimal', nullable: false, precision: 10, scale: 2 })
  total_prices: number;

  @Column({ type: 'int', nullable: false })
  use_score: number;

  @ManyToOne(() => Order, (order) => order.orderDetails)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @OneToOne(() => Ticket, (ticket) => ticket.orderDetails)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @ManyToOne(() => Schedule, (schedule) => schedule.orderDetails)
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;
}
