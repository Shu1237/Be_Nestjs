import {
  Entity,
  TableInheritance,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { OrderExtra } from '../order/order-extra';
import { ProductTypeEnum } from 'src/common/enums/product.enum';

@Entity('product')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  price: string;

  @Column({ 
    type: 'enum', 
    enum: ProductTypeEnum, 
    nullable: false,
    comment: 'Category of the product - food, drink, or combo'
  })
  category: ProductTypeEnum;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @OneToMany(() => OrderExtra, (orderExtra) => orderExtra.product)
  orderExtras: OrderExtra[];
}
