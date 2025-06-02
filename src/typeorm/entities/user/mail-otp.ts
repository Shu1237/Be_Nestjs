import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user';


@Entity('mail_otp')
export class MailOTP {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ type: 'varchar', nullable: false })
  otp: string;

  @Column({ type: 'boolean', nullable: false })
  is_used: boolean;

  @Column({ type: 'datetime', nullable: false })
  expires_at: Date;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  created_at: Date;


}