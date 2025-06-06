import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Order } from '../order/order';

@Entity('promotion')
export class Promotion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  detail?: string;

  @Column({ type: 'varchar', nullable: false })
  code: string;

  @Column({ type: 'varchar', nullable: false })
  discount: string;

  @Column({ type: 'datetime', nullable: true })
  start_time?: Date;

  @Column({ type: 'datetime', nullable: true })
  end_time?: Date;

  @Column({ type: 'int', nullable: false })
  exchange: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
  @OneToMany(() => Order, (order) => order.promotion)
  orders: Order[];
}