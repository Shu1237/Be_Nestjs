import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Combo } from './combo';
import { Drink } from './drink';
import { Food } from './food';


@Entity('combo_detail')
@Index(['combo_id', 'drink_id', 'food_id'], { unique: true })
export class ComboDetail {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable: false })
  combo_id: number;

  @Column({ type: 'int', nullable: false })
  drink_id: number;

  @Column({ type: 'int', nullable: false })
  food_id: number;

  @Column({ type: 'decimal', nullable: false, precision: 10, scale: 2 })
  prices: number;

  @Column({ type: 'int', nullable: false })
  quantity: number;

  @ManyToOne(() => Combo, (combo) => combo.comboDetails)
  @JoinColumn({ name: 'combo_id' })
  combo: Combo;

  @ManyToOne(() => Drink, (drink) => drink.comboDetails)
  @JoinColumn({ name: 'drink_id' })
  drink: Drink;

  @ManyToOne(() => Food, (food) => food.comboDetails)
  @JoinColumn({ name: 'food_id' })
  food: Food;
}