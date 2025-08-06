import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/database/entities/item/product';
import { Combo } from 'src/database/entities/item/combo';
import { Food } from 'src/database/entities/item/food';
import { Drink } from 'src/database/entities/item/drink';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Combo, Food, Drink])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
