import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user';
import { Order } from './order';

@Entity('history_score')
export class HistoryScore {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ type: 'integer' })
  score_change: number;
  @Column({ type: 'timestamp' })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.historyScores)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => Order, (order) => order.historyScore)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
