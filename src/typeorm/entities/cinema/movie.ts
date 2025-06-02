import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Schedule } from './schedule';
import { ActorMovie } from './actor-movie';
import { MovieGenre } from './gerne-movie';


@Entity('movie')
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 100 })
  director: string;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'date' })
  from_date: Date;

  @Column({ type: 'date' })
  to_date: Date;

  @Column({ type: 'varchar', length: 100 })
  production_company: string;

  @Column({ type: 'varchar', length: 255 })
  thumbnail: string;

  @Column({ type: 'varchar', length: 255 })
  banner: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  version?: string;
  
  @Column({ type: 'boolean', default: false }) // Cột để đánh dấu xóa mềm
  is_deleted: boolean;

  @OneToMany(() => MovieGenre, (movieGenre) => movieGenre.movie)
  movieGenres: MovieGenre[];

  @OneToMany(() => Schedule, (schedule) => schedule.movie)
  schedules: Schedule[];

  @OneToMany(() => ActorMovie, (actorMovie) => actorMovie.movie)
  actorMovies: ActorMovie[];


}