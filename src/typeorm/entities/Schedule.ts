import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MovieSchedule } from "./Movie_schedule";

@Entity("MOVIETHEATER_SCHEDULE")
export class Schedule {
  @PrimaryGeneratedColumn("uuid")
  SCHEDULE_ID: string;

  @Column({ type: "varchar", length: 255 })
  SCHEDULE_TIME: string;

  @OneToMany(() => MovieSchedule, (movieSchedule) => movieSchedule.schedule)
  movieSchedules: MovieSchedule[];
}
