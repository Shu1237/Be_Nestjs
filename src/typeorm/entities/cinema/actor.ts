import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ActorMovie } from './actor-movie';


@Entity('actor')
export class Actor {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', nullable: false ,length: 100}) // ten dien vien
  name: string;

  @Column({ type: 'varchar', nullable: true ,length: 100}) // nickname
  stage_name?: string;

  @Column({ type: 'boolean', nullable: false })
  gender: boolean;

  @Column({ type: 'date', nullable: false })
  date_of_birth: Date;

  @Column({ type: 'varchar', nullable: false ,length: 100})
  nationality: string;

  @Column({ type: 'varchar', nullable: false ,length: 100}) //( tieu su)
  biography: string;

  @Column({ type: 'varchar', nullable: false ,length: 255})
  profile_image: string;

  @Column({ type: 'datetime', nullable: false })
  created_at: Date;

  @Column({ type: 'datetime', nullable: false })
  updated_at: Date;

  @OneToMany(() => ActorMovie, (actorMovie) => actorMovie.actor)
  actorMovies: ActorMovie[];
}