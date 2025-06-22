import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/typeorm/entities/item/product';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';
import { Drink } from 'src/typeorm/entities/item/drink';
import { Food } from 'src/typeorm/entities/item/food';
import { Combo } from 'src/typeorm/entities/item/combo';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createProduct(dto: CreateProductDto) {
    let product: Product;
    switch (dto.type) {
      case 'drink':
        product = Object.assign(new Drink(), dto);
        break;
      case 'food':
        product = Object.assign(new Food(), dto);
        break;
      case 'combo':
        product = Object.assign(new Combo(), dto);
        break;
      default:
        throw new Error('Invalid product type');
    }
    await this.productRepository.save(product);
    return { msg: 'Product created successfully' };
  }
  async getAllProducts() {
    return await this.productRepository.find();
  }

  async getProductById(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(id: number, dto: UpdateProductDto) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    Object.assign(product, dto);
    await this.productRepository.save(product);
    return { msg: 'Product updated successfully' };
  }

  async deleteProduct(id: number) {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Product not found');
    return { msg: 'Product deleted successfully' };
  }

  
  async softDeleteProduct(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    product.is_deleted = true; // Giả sử bạn có trường isDeleted trong entity
    await this.productRepository.save(product);
    return { msg: 'Product soft deleted successfully' };
  }
}
