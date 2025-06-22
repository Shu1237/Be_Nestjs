import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NotFoundException } from "src/common/exceptions/not-found.exception";
import { Product } from "src/database/entities/item/product";
import {  Repository } from "typeorm";


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