import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NotFoundException } from "src/common/exceptions/not-found.exception";
import { Product } from "src/database/entities/item/product";
import { Repository } from "typeorm";
import { CreateProductDto } from "./dto/createProdcut.dto";
import { Drink } from "src/database/entities/item/drink";
import { Combo } from "src/database/entities/item/combo";
import { Food } from "src/database/entities/item/food";
import { UpdateProductDto } from "./dto/updateProduct.dto";
import { BadRequestException } from "@nestjs/common";


@Injectable()
export class ProductService {
    constructor() { }
    @InjectRepository(Product)
    private productRepository: Repository<Product>
    async getAllProducts() {
        const products = await this.productRepository.find()
        return products;

    }


    async getProdcutById(productIds: number) {
        const orderExtras = await this.productRepository.find({
            where: { id: productIds },

        });
        if (!orderExtras || orderExtras.length === 0) {
            throw new NotFoundException(`No products found for IDs: ${productIds}`);
        }

        return orderExtras;
    }



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
        product.is_deleted = true;
        await this.productRepository.save(product);
        return { msg: 'Product soft deleted successfully' };
    }

    async restoreProduct(id: number) {
        const product = await this.productRepository.findOne({ where: { id } });
        if (!product) throw new NotFoundException('Product not found');
        if (!product.is_deleted) {
            throw new BadRequestException('Product is not soft-deleted');
        }
        product.is_deleted = false;
        await this.productRepository.save(product);
        return { msg: 'Product restored successfully' };
    }
}   