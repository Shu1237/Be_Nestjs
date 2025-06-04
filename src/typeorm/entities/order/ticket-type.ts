import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Ticket } from './ticket';


@Entity('ticket_type')
export class TicketType {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', nullable: false })
  ticket_name: string;

  @Column({ type: 'decimal', nullable: false, precision: 10, scale: 2 })
  discount: string;

  @Column({ type: 'varchar', nullable: false })
  audience_type: string; 

  @Column({ type: 'varchar', nullable: true })
  ticket_description?: string;

  @OneToMany(() => Ticket, (ticket) => ticket.ticketType)
  tickets: Ticket[];
}