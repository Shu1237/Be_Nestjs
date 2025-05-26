import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Movie } from "./Movie";
import { Schedule } from "./Schedule";

@Entity("MOVIETHEATER_MOVIE_SCHEDULE")
export class MovieSchedule {
  @PrimaryGeneratedColumn("uuid")
  SCHEDULE_ID: string;

  @Column({ type: "varchar", length: 255 })
  MOVIE_ID: string;

  @ManyToOne(() => Movie, (movie) => movie.movieSchedules, { nullable: false })
  @JoinColumn({ name: "MOVIE_ID" })
  movie: Movie;

  @Column({ type: "varchar", length: 255 })
  SCHEDULE_ID_REF: string;

  @ManyToOne(() => Schedule, (schedule) => schedule.movieSchedules, { nullable: false })
  @JoinColumn({ name: "SCHEDULE_ID" })
  schedule: Schedule;
}