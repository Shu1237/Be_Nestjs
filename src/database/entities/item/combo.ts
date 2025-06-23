import { Column } from "typeorm";
import { ChildEntity } from "typeorm";
import { Product } from "./product";

@ChildEntity()
export class Combo extends Product {
  @Column({ type: 'int', nullable: true })
  discount?: number;

}
