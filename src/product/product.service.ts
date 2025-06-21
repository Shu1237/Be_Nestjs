import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/typeorm/entities/item/product';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';


@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createProduct(dto: CreateProductDto) {
    const product = this.productRepository.create(dto);
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