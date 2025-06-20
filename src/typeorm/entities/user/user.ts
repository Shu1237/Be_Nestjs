import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { RefreshToken } from './refresh-token';
import { Role } from './roles';
import { Order } from '../order/order';
import { HistoryScore } from '../order/history_score';


@Entity('user')
export class User {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar?: string;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => HistoryScore, (historyScore) => historyScore.user)
  historyScores: HistoryScore[];
}
