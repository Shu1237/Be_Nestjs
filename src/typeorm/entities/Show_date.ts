import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MovieDate } from "./Movie_date";

@Entity("MOVIETHEATER_SHOW_DATES")
export class ShowDate {
  @PrimaryGeneratedColumn("uuid")
  SHOW_DATE_ID: string;

  @Column({ type: "date" })
  SHOW_DATE: Date;

  @Column({ type: "varchar", length: 255 })
  MOVIE_DATE_ID: string;

  @ManyToOne(() => MovieDate, (movieDate) => movieDate.showDates, { nullable: false })
  @JoinColumn({ name: "MOVIE_DATE_ID" })
  movieDate: MovieDate;
}