import {
  Entity,
  Column,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user';

@Entity('member')
export class Member {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  score: number;

  @OneToOne(() => User, (user) => user.member)
  @JoinColumn({ name: 'account_id' })
  account: User;
}
