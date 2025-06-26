import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, OneToOne, CreateDateColumn } from 'typeorm';
import { User } from '../user/user';
import { Promotion } from '../promotion/promotion';
import { OrderDetail } from './order-detail';
import { Transaction } from './transaction';
import { HistoryScore } from './history_score';
import { OrderExtra } from './order-extra';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  total_prices: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  status: string;

  @CreateDateColumn({ type: 'timestamp' })
  order_date: Date;

  @Column({ type: 'varchar', length: 256, nullable: true })
  qr_code: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  customer_id: string;

  @ManyToOne(() => User, (user) => user.orders, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;
 

  @ManyToOne(() => Promotion, (promotion) => promotion.orders, { nullable: true })
  @JoinColumn({ name: 'promotion_id' })
  promotion?: Promotion;

  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order, { cascade: true })
  orderDetails: OrderDetail[];

  @OneToMany(() => OrderExtra, (orderExtra) => orderExtra.order, { cascade: true })
  orderExtras: OrderExtra[];

  @OneToOne(() => Transaction, (transaction) => transaction.order, { nullable: true })
  @JoinColumn()
  transaction: Transaction;

  @OneToOne(() => HistoryScore, (historyScore) => historyScore.order, { nullable: true })
  historyScore: HistoryScore;
}