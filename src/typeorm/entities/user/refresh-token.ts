import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import { User } from './user';


@Entity('refresh_token')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  access_token: string;

  @Column({ type: 'text' })
  refresh_token: string;

  
  @Column({ type: 'boolean', default: false })
  revoked: boolean;

  @Column({ type: 'datetime' })
  expires_at: Date;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;


  @ManyToOne(() => User, (user) => user.refreshTokens)
  @JoinColumn({ name: 'user_id' })
  user: User;
}