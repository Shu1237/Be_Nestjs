import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Account } from "./Account";



@Entity("MOVIETHEATER_ROLES")
export class Role {
  @PrimaryGeneratedColumn("uuid")
  ROLE_ID: string;

  @Column({ type: "varchar", length: 255 })
  ROLE_NAME: string;


  @OneToMany(() => Account, (account) => account.role)
  accounts: Account[];
}