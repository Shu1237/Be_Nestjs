import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { ComboDetail } from './combo-detail';
import { OrderProduct } from '../order/order-product';


@Entity('combo')
export class Combo {
  @PrimaryGeneratedColumn({ type: 'int' })
  combo_id: number;

  @Column({ type: 'varchar', nullable: false })
  combo_name: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ type: 'decimal', nullable: false, precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', nullable: true })
  discount?: number;

  @OneToMany(() => ComboDetail, (comboDetail) => comboDetail.combo)
  comboDetails: ComboDetail[];

  @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.combo)
  orderProducts: OrderProduct[];
}