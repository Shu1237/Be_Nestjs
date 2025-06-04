import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { User } from '../user/user';
import { Promotion } from '../promotion/promotion';
import { OrderDetail } from './order-detail';
import { OrderProduct } from './order-product';
import { Transaction } from './transaction';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'date', nullable: false })
  booking_date: Date;

  @Column({ type: 'int', default: 0 })
  add_score: number;

  @Column({ type: 'int', default: 0 })
  use_score: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  total_prices: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  status: string;

  @ManyToOne(() => User, (user) => user.orders, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;


  @ManyToOne(() => Promotion, (promotion) => promotion.orders, { nullable: true })
  @JoinColumn({ name: 'promotion_id' })
  promotion?: Promotion;

  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order, { cascade: true })
  orderDetails: OrderDetail[];

  @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.order, { cascade: true })
  orderProducts: OrderProduct[];

  @OneToOne(() => Transaction, (transaction) => transaction.order, { nullable: true })
  @JoinColumn()
  transaction: Transaction;
}