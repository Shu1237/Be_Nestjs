import { Column, OneToMany } from "typeorm";
import { ChildEntity } from "typeorm";

import { Product } from "./product";
import { ComboDetail } from "./combo_detail";

@ChildEntity()
export class Combo extends Product {
  @Column({ type: 'int', nullable: true,default: 0  })
  discount?: number;

  @OneToMany(() => ComboDetail, (detail) => detail.combo, { cascade: true })
  comboDetails: ComboDetail[];
}
