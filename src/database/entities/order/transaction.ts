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

  @Column({ type: 'varchar', nullable: false })
  transaction_code: string;

  @Column({ type: 'date', nullable: false })
  transaction_date: Date;

  @Column({ type: 'decimal', nullable: false, precision: 10, scale: 2 })
  prices: string;

  @Column({ type: 'varchar', nullable: false })
  status: string;

  @OneToOne(() => Order, (order) => order.transaction)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => PaymentMethod, (paymentMethod) => paymentMethod.transactions)
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod;
 
}
