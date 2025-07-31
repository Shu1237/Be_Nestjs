import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Promotion } from './promotion';

@Entity('promotion_types')
export class PromotionType {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  type: string;

  @OneToMany(() => Promotion, (promotion) => promotion.promotionType)
  promotions: Promotion[];
}
