import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Order } from './order';
import { PaymentMethod } from './payment-method';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable: false })
  order_id: number;

  @Column({ type: 'varchar', nullable: false })
  transaction_code: string;

  @Column({ type: 'int', nullable: false })
  payment_method_id: number;

  @Column({ type: 'date', nullable: false })
  transaction_date: Date;

  @Column({ type: 'decimal', nullable: false, precision: 10, scale: 2 })
  prices: number;

  @Column({ type: 'boolean', nullable: false })
  status: boolean;

  @OneToOne(() => Order, (order) => order.transaction)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => PaymentMethod, (paymentMethod) => paymentMethod.transactions)
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod;
 
}
