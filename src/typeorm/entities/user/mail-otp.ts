import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user';


@Entity('mail_otp')
export class MailOTP {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ type: 'varchar', nullable: false })
  user_id: string;

  @Column({ type: 'varchar', nullable: false })
  otp: string;

  @Column({ type: 'boolean', nullable: false })
  is_used: boolean;

  @Column({ type: 'datetime', nullable: false })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: false })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.mailOTPs)
  @JoinColumn({ name: 'user_id' })
  user: User;
}