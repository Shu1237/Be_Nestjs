import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Combo } from './combo';
import { Drink } from './drink';
import { Food } from './food';

@Entity('combo_detail')
export class ComboDetail {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'decimal', nullable: false, precision: 10, scale: 2 })
  prices: number;

  @Column({ type: 'int', nullable: false })
  quantity: number;


  @ManyToOne(() => Combo, (combo) => combo.comboDetails)
  @JoinColumn({ name: 'combo_id' })
  combo: Combo;




  @ManyToOne(() => Drink, (drink) => drink.comboDetails,{ nullable: true })
  @JoinColumn({ name: 'drink_id' })
  drink: Drink;

  

  @ManyToOne(() => Food, (food) => food.comboDetails,{ nullable: true })
  @JoinColumn({ name: 'food_id' })
  food: Food;


}
