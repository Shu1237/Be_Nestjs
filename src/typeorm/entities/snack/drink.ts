import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ComboDetail } from './combo-detail';
import { OrderProduct } from '../order/order-product';


@Entity('drink')
export class Drink {
  @PrimaryGeneratedColumn({ type: 'int' })
  drink_id: number;

  @Column({ type: 'varchar', nullable: false })
  drink_name: string;

  @Column({ type: 'decimal', nullable: false, precision: 10, scale: 2 })
  prices: number;

  @Column({ type: 'varchar', nullable: true })
  category?: string;

  @OneToMany(() => ComboDetail, (comboDetail) => comboDetail.drink)
  comboDetails: ComboDetail[];

  @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.drink)
  orderProducts: OrderProduct[];
}