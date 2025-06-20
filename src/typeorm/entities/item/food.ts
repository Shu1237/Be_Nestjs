// food.entity.ts
import { ChildEntity } from 'typeorm';
import { Product } from './product';

@ChildEntity()
export class Food extends Product {
  // Food inherits all properties and relationships from Product
  // No additional properties needed since relationships are handled at Product level
}
