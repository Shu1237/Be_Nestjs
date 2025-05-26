import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Movie } from "./Movie";
import { Type } from "./Type";


// Bảng MOVIETHEATER_MOVIE_TYPE
@Entity("MOVIETHEATER_MOVIE_TYPE")
export class MovieType {
  @PrimaryGeneratedColumn("uuid")
  TYPE_ID: string;

  @Column({ type: "varchar", length: 255 })
  MOVIE_ID: string;

  @ManyToOne(() => Movie, (movie) => movie.movieTypes, { nullable: false })
  @JoinColumn({ name: "MOVIE_ID" })
  movie: Movie;

  @Column({ type: "varchar", length: 255 })
  TYPE_ID_REF: string;

  @ManyToOne(() => Type, (type) => type.movieTypes, { nullable: false })
  @JoinColumn({ name: "TYPE_ID" })
  type: Type;
}