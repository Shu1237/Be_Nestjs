import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from './user';


@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({ type: 'int' })
  role_id: number;

  @Column({ type: 'varchar', nullable: true })
  role_name: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}