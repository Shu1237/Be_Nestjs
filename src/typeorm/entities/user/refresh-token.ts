import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user';


@Entity('refresh_token')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' , length: 36 })
  user_id: string;

  @Column({ type: 'text' })
  access_token: string;

  @Column({ type: 'text' })
  refresh_token: string;
  
  @Column({ type: 'boolean', default: false })
  revoked: boolean;

  @Column({ type: 'datetime' })
  expires_at: Date;

  @Column({ type: 'datetime' })
  created_at: Date;


  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}