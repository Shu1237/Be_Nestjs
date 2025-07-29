import {
  Entity,
  TableInheritance,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { OrderExtra } from '../order/order-extra';

@Entity('product')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ default: false })
  is_deleted: boolean;

  @OneToMany(() => OrderExtra, (orderExtra) => orderExtra.product)
  orderExtras: OrderExtra[];
}
