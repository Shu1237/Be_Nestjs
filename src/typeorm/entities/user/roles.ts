import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from './user';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({ type: 'int' })
  role_id: number;

  @Column({ type: 'varchar', nullable: false })
  role_name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
