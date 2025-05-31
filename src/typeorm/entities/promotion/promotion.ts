import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Order } from '../order/order';

@Entity('promotion')
export class Promotion {
  @PrimaryGeneratedColumn({ type: 'int' })
  promotion_id: number;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  detail?: string;

  @Column({ type: 'int', nullable: false })
  discount_level: number;

  @Column({ type: 'datetime', nullable: true })
  start_time?: Date;

  @Column({ type: 'datetime', nullable: true })
  end_time?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  exchange?: number;


  @OneToMany(() => Order, (order) => order.promotion)
  orders: Order[];
}