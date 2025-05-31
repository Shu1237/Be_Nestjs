import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { MovieGenre } from './gerne-movie';


@Entity('genre')
export class Genre {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  genre_name?: string;

  @OneToMany(() => MovieGenre, (movieGenre) => movieGenre.genre)
  movieGenres: MovieGenre[];
}