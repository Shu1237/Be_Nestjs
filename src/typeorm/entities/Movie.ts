import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MovieDate } from "./Movie_date";
import { MovieSchedule } from "./Movie_schedule";
import { MovieType } from "./Movie_type";

@Entity("MOVIETHEATER_MOVIE")
export class Movie {
  @PrimaryGeneratedColumn("uuid")
  MOVIE_ID: string;

  @Column({ type: "varchar", length: 255 })
  ACTOR: string;

  @Column({ type: "varchar", length: 1000 })
  CONTENT: string;

  @Column({ type: "varchar", length: 255 })
  DIRECTOR: string;

  @Column({ type: "int" })
  DURATION: number;

  @Column({ type: "date" })
  FROM_DATE: Date;

  @Column({ type: "varchar", length: 255 })
  MOVIE_PRODUCTION_COMPANY: string;

  @Column({ type: "date" })
  TO_DATE: Date;

  @Column({ type: "varchar", length: 255 })
  VERSION: string;

  @Column({ type: "varchar", length: 255 })
  MOVIE_NAME_EN: string;

  @Column({ type: "varchar", length: 255 })
  MOVIE_NAME_VN: string;

  @Column({ type: "varchar", length: 255 })
  LARGE_IMAGE: string;

  @Column({ type: "varchar", length: 255 })
  SMALL_IMAGE: string;

  @OneToMany(() => MovieDate, (movieDate) => movieDate.movie)
  movieDates: MovieDate[];

  @OneToMany(() => MovieSchedule, (movieSchedule) => movieSchedule.movie)
  movieSchedules: MovieSchedule[];

  @OneToMany(() => MovieType, (movieType) => movieType.movie)
  movieTypes: MovieType[];
}