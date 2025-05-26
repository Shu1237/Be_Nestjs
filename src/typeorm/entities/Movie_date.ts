import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Movie } from "./Movie";
import { ShowDate } from "./Show_date";

@Entity("MOVIETHEATER_MOVIE_DATE")
export class MovieDate {
  @PrimaryGeneratedColumn("uuid")
  SHOW_DATE_ID: string;

  @Column({ type: "varchar", length: 255 })
  MOVIE_ID: string;

  @ManyToOne(() => Movie, (movie) => movie.movieDates, { nullable: false })
  @JoinColumn({ name: "MOVIE_ID" })
  movie: Movie;

  @OneToMany(() => ShowDate, (showDate) => showDate.movieDate)
  showDates: ShowDate[];
}