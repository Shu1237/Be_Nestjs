
import {
  Entity,
  Column,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToMany,
} from 'typeorm';

import { Schedule } from './schedule';
// import { ActorMovie } from './actor-movie';
// import { MovieGenre } from './gerne-movie';
import { Actor } from './actor';
import { Gerne } from './gerne';
import { Version } from './version';

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

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  // @OneToMany(() => MovieGenre, (movieGenre) => movieGenre.movie)
  // movieGenres: MovieGenre[];

  @OneToMany(() => Schedule, (schedule) => schedule.movie)
  schedules: Schedule[];

  @ManyToMany(() => Actor, (actor) => actor.movies)
  actors: Actor[];

  @ManyToMany(() => Gerne, (gerne) => gerne.movies)
  gernes: Gerne[];

  @ManyToMany(() => Version, (version) => version.movies)
  versions: Version[];
}

// trong bang movie co them bang versionversion
// hard delete khi check cac entities xem lien quan den cac bang ,gan co cac bang co tham chieu, lich chieu voi order
// phim cho ai xem
//ví dụ bạn là senior nếu  mua ticket nếu chỗ ngồi còn thì cho thanh toán trong 10p nếu hết 10p thì xuống
