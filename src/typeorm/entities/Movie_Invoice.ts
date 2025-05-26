import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Account } from "./Account";

@Entity("MOVIETHEATER_INVOICE")
export class Invoice {
  @PrimaryGeneratedColumn("uuid")
  INVOICE_ID: string;

  @Column({ type: "varchar", length: 255 })
  ACCOUNT_ID: string;

  @Column({ type: "int" })
  ADD_SCORE: number;

  @Column({ type: "timestamp" })
  BOOKING_DATE: Date;

  @Column({ type: "varchar", length: 255 })
  MOVIE_NAME: string;

  @Column({ type: "varchar", length: 255 })
  SCHEDULE_SHOW: string;

  @Column({ type: "varchar", length: 255 })
  SCHEDULE_SHOW_TIME: string;

  @Column({ type: "varchar", length: 255 })
  STATUS: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  TOTAL_MONEY: number;

  @Column({ type: "int" })
  USE_SCORE: number;

  @Column({ type: "varchar", length: 255 })
  SEAT: string;

  @ManyToOne(() => Account, (account) => account.invoices)
  account: Account;
}