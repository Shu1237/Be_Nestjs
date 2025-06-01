import { Entity, Column, PrimaryColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Schedule } from './schedule';
import { ActorMovie } from './actor-movie';
import { MovieGenre } from './gerne-movie';


@Entity('movie')
export class Movie {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', nullable: false, length: 100 })
  name: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'varchar', nullable: false, length: 100 })
  director: string;

  @Column({ type: 'int', nullable: false })
  duration: number;

  @Column({ type: 'date', nullable: false })
  from_date: Date;

  @Column({ type: 'date', nullable: false })
  to_date: Date;

  @Column({ type: 'varchar', nullable: false, length: 100 })
  production_company: string;

  @Column({ type: 'varchar', nullable: false, length: 255 })
  thumbnail: string;

  @Column({ type: 'varchar', nullable: false, length: 255 })
  banner: string;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  version?: string;

  @OneToMany(() => MovieGenre, (movieGenre) => movieGenre.movie)
  movieGenres: MovieGenre[];

  @OneToMany(() => Schedule, (schedule) => schedule.movie)
  schedules: Schedule[];

  @OneToMany(() => ActorMovie, (actorMovie) => actorMovie.movie)
  actorMovies: ActorMovie[];


}