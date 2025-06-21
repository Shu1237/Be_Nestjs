import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "src/typeorm/entities/item/product";
import { In, Repository } from "typeorm";


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
}   