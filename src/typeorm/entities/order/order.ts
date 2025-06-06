import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { User } from '../user/user';
import { Promotion } from '../promotion/promotion';
import { OrderDetail } from './order-detail';
import { OrderProduct } from './order-product';
import { Transaction } from './transaction';


@Entity('order')
export class Order {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;


  @Column({ type: 'date', nullable: false })
  booking_date: Date;

  @Column({ type: 'decimal', nullable: false, precision: 10, scale: 2 })
  total_prices: number;


  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Promotion, (promotion) => promotion.orders, { nullable: true })
  @JoinColumn({ name: 'promotion_id' })
  promotion?: Promotion;

  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order)
  orderDetails: OrderDetail[];

  @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.order)
  orderProducts: OrderProduct[];

  @OneToOne(() => Transaction, (transaction) => transaction.order)
  transaction: Transaction;
}