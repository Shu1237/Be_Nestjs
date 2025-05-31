import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user';

@Entity('member')
export class Member {
  @PrimaryColumn({ type: 'varchar', nullable: false, unique: true })
  member_id: string;

  @Column({ type: 'int', nullable: false })
  score: number;

  @Column({ type: 'varchar', nullable: false })
  account_id: string;

  @Column({ type: 'int', nullable: true })
  member_type?: number;

 @OneToOne(() => User, (user) => user.member)
  @JoinColumn({ name: 'account_id' })
  account: User;
}