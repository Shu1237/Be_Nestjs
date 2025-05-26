import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./Roles";
import { Member } from "./Member";
import { Employee } from "./Employtee";
import { Invoice } from "./Movie_Invoice";
import { RefreshToken } from "./RefreshToken";

@Entity("MOVIETHEATER_ACCOUNT")
export class Account {
  @PrimaryGeneratedColumn("uuid")
  ACCOUNT_ID: string;

  @Column({ type: "varchar", length: 255 })
  ADDRESS: string;

  @Column({ type: "date" })
  DATE_OF_BIRTH: Date;

  @Column({ type: "varchar", length: 255 })
  EMAIL: string;

  @Column({ type: "varchar", length: 255 })
  FULL_NAME: string;

  @Column({ type: "int" })
  GENDER: number;

  @Column({ type: "varchar", length: 255 })
  IDENTITY_CARD: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  IMAGE: string;

  @Column({ type: "varchar", length: 255 })
  PASSWORD: string;

  @Column({ type: "varchar", length: 255 })
  PHONE_NUMBER: string;

  @Column({ type: "date" })
  REGISTER_DATE: Date;

  @Column({ type: "varchar", length: 255, nullable: true, default: "ACTIVE" })
  STATUS: string;

  @Column({ type: "varchar", length: 255 })
  USERNAME: string;

  @ManyToOne(() => Role, (role) => role.accounts, { nullable: false })
  @JoinColumn({ name: "ROLE_ID" })
  role: Role;

  @OneToMany(() => Member, (member) => member.account)
  members: Member[];

  @OneToMany(() => Employee, (employee) => employee.account)
  employees: Employee[];

  @OneToMany(() => Invoice, (invoice) => invoice.account)
  invoices: Invoice[];



  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.account)
  refreshTokens: RefreshToken[];
}