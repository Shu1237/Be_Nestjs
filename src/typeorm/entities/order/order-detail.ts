import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Schedule } from "../cinema/schedule";
import { Order } from "./order";
import { Ticket } from "./ticket";

@Entity('order_detail')
export class OrderDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @Column({ type: 'decimal', nullable: false, precision: 10, scale: 2 })
  total_each_ticket: string;



  @ManyToOne(() => Order, (order) => order.orderDetails)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @OneToOne(() => Ticket, (ticket) => ticket.orderDetail)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @ManyToOne(() => Schedule, (schedule) => schedule.orderDetails)
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;
}
