import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Account } from "./Account";

@Entity("MOVIETHEATER_EMPLOYEE")
export class Employee {
  @PrimaryGeneratedColumn("uuid")
  EMPLOYEE_ID: string;

  @Column({ type: "varchar", length: 255 })
  ACCOUNT_ID: string;

  @ManyToOne(() => Account, (account) => account.employees)
  account: Account;
}
