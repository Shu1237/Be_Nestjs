import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Movie } from './movie';

@Entity('version')
export class Version {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ManyToMany(() => Movie, (movie) => movie.versions)
  @JoinTable()
  movies: Movie[];
}