import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Account } from "./Account";

@Entity("MOVIETHEATER_MEMBER")
export class Member {
  @PrimaryGeneratedColumn("uuid")
  MEMBER_ID: string;

  @Column({ type: "int" })
  SCORE: number;

  @Column({ type: "varchar", length: 255 })
  ACCOUNT_ID: string;

  
  @OneToOne(() => Account, (account) => account.member)
  @JoinColumn({ name: "ACCOUNT_ID" }) // dùng để mapping cột khóa ngoại
  account: Account;
}
