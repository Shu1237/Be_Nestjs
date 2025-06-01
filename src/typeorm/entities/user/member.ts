import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user';

@Entity('member')
export class Member {
 @PrimaryGeneratedColumn()
 id:number

  @Column({ type: 'int', nullable: false })
  score: number;

  @Column({ type: 'varchar', nullable: false })
  account_id: string;



 @OneToOne(() => User, (user) => user.member)
  @JoinColumn({ name: 'account_id' })
  account: User;
}