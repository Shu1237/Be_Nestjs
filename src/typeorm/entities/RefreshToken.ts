import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './Account';

@Entity({ name: 'refresh_token' })
export class RefreshToken {
  @PrimaryGeneratedColumn()
  REFRESH_TOKEN_ID: number;

  @Column()
  REFRESH_TOKEN: string;

  @Column({ nullable: true })
  ACCESS_TOKEN?: string;

  @Column()
  ACCOUNT_ID: number;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'ACCOUNT_ID' })
  account: Account;

  @Column()
  EXPIRES_AT: Date;

  @Column({ default: false })
  IS_USED: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  CREATED_AT: Date;
}
