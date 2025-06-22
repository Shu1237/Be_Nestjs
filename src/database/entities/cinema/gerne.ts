import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
// import { MovieGenre } from './gerne-movie';
import { Movie } from './movie';

@Entity('genre')
export class Gerne {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  genre_name: string;
  @Column({ type: 'boolean', default: false })
  is_deleted: boolean; //
  // @OneToMany(() => MovieGenre, (movieGenre) => movieGenre.genre)
  // movieGenres: MovieGenre[];

  @ManyToMany(() => Movie, (movie) => movie.gernes)
  @JoinTable()
  movies: Movie[];
  
}
