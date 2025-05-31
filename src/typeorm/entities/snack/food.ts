import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ComboDetail } from './combo-detail';
import { OrderProduct } from '../order/order-product';

@Entity('food')
export class Food {
  @PrimaryGeneratedColumn({ type: 'int' })
  food_id: number;

  @Column({ type: 'varchar', length: 255 })
  food_name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  prices: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  @OneToMany(() => ComboDetail, (comboDetail) => comboDetail.food)
  comboDetails: ComboDetail[];

  @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.food)
  orderProducts: OrderProduct[];
}