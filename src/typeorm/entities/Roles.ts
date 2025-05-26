import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Account } from "./Account";



@Entity("MOVIETHEATER_ROLES")
export class Role {
  @PrimaryColumn({ type: 'int' })
  ROLE_ID: number;

  @Column({ type: "varchar", length: 255 })
  ROLE_NAME: string;


  @OneToMany(() => Account, (account) => account.role)
  accounts: Account[];
}