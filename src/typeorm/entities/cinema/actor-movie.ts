import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Actor } from './actor';
import { Movie } from './movie';

@Entity('actor_movie')
export class ActorMovie {
  @PrimaryColumn({ type: 'int' })
  actor_id: number;

  @PrimaryColumn({ type: 'int' })
  movie_id: number;

  @ManyToOne(() => Actor, (actor) => actor.actorMovies,)
  @JoinColumn({ name: 'actor_id' })
  actor: Actor;

  @ManyToOne(() => Movie, (movie) => movie.actorMovies)
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;
}
