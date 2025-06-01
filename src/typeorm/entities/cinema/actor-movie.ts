import { Entity, PrimaryColumn, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Actor } from './actor';
import { Movie } from './movie';

@Entity('actor_movie')
export class ActorMovie {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;
  
  @ManyToOne(() => Actor, (actor) => actor.actorMovies,)
  @JoinColumn({ name: 'actor_id' })
  actor: Actor;

  @ManyToOne(() => Movie, (movie) => movie.actorMovies)
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;
}
