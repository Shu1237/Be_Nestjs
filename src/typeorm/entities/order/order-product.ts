import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Order } from './order';
import { Drink } from '../snack/drink';
import { Food } from '../snack/food';
import { Combo } from '../snack/combo';


@Entity('order_product')
export class OrderProduct {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;


  @Column({ type: 'int', nullable: false })
  quantity: number;


  @Column({ type: 'decimal', nullable: false, precision: 10, scale: 2 })
  prices: number;
  
  @ManyToOne(() => Order, (order) => order.orderProducts)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Drink, (drink) => drink.orderProducts, { nullable: true })
  @JoinColumn({ name: 'drink_id' })
  drink: Drink;

  @ManyToOne(() => Food, (food) => food.orderProducts, { nullable: true })
  @JoinColumn({ name: 'food_id' })
  food: Food;

  @ManyToOne(() => Combo, (combo) => combo.orderProducts, { nullable: true }  )
  @JoinColumn({ name: 'combo_id' })
  combo: Combo;
  

}