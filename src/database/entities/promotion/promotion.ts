import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from '../order/order';
import { PromotionType } from './promtion_type';

@Entity('promotion')
export class Promotion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  detail?: string;

  @Column({ type: 'varchar', nullable: false })
  code: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  discount: string;

  @Column({ type: 'datetime', nullable: true })
  start_time?: Date;

  @Column({ type: 'datetime', nullable: true })
  end_time?: Date;

  @Column({ type: 'int', nullable: false })
  exchange: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
  @OneToMany(() => Order, (order) => order.promotion)
  orders: Order[];

  @ManyToOne(() => PromotionType, (promotionType) => promotionType.promotions)
  @JoinColumn({ name: 'promotion_type_id' })
  promotionType: PromotionType;
}
