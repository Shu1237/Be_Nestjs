import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

import { Movie } from './movie';
import { Genre } from './gerne';

@Entity('movie_genre')
export class MovieGenre {
  @PrimaryColumn({ type: 'int' })
  movie_id: number;

  @PrimaryColumn({ type: 'int' })
  genre_id: number;

  @ManyToOne(() => Movie, (movie) => movie.movieGenres)
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @ManyToOne(() => Genre, (genre) => genre.movieGenres)
  @JoinColumn({ name: 'genre_id' })
  genre: Genre;

}