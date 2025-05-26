import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Account } from "./Account";

@Entity("MOVIETHEATER_MEMBER")
export class Member {
  @PrimaryGeneratedColumn("uuid")
  MEMBER_ID: string;

  @Column({ type: "int" })
  SCORE: number;

  @Column({ type: "varchar", length: 255 })
  ACCOUNT_ID: string;

  @ManyToOne(() => Account, (account) => account.members)
  account: Account;
}
