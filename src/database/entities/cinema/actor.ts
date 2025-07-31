import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
// import { ActorMovie } from './actor-movie';
import { Movie } from './movie';
import { Gender } from 'src/common/utils/type';

@Entity('actor')
export class Actor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false, length: 100 }) // ten dien vien
  name: string;

  @Column({ type: 'varchar', nullable: true, length: 100 }) // nickname
  stage_name?: string;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.OTHER,
  })
  gender: Gender;

  @Column({ type: 'date', nullable: false })
  date_of_birth: Date;

  @Column({ type: 'varchar', nullable: false, length: 100 })
  nationality: string;

  @Column({ type: 'varchar', nullable: false, length: 100 }) //( tieu su)
  biography: string;

  @Column({ type: 'varchar', nullable: false, length: 255 })
  profile_image: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @ManyToMany(() => Movie, (movie) => movie.actors)
  @JoinTable()
  movies: Movie[];
}
