import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MovieType } from "./Movie_type";

@Entity("MOVIETHEATER_TYPE")
export class Type {
  @PrimaryGeneratedColumn("uuid")
  TYPE_ID: string;

  @Column({ type: "varchar", length: 255 })
  TYPE_NAME: string;

  @OneToMany(() => MovieType, (movieType) => movieType.type)
  movieTypes: MovieType[];
}