import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { Product } from 'src/database/entities/item/product';
import { Repository, In } from 'typeorm';
import { CreateProductDto } from './dto/createProdcut.dto';
import { Drink } from 'src/database/entities/item/drink';
import { Combo } from 'src/database/entities/item/combo';
import { Food } from 'src/database/entities/item/food';
import { UpdateProductDto } from './dto/updateProduct.dto';

import { BadRequestException } from '@nestjs/common';

import { ProductPaginationDto } from 'src/common/pagination/dto/product/productPagination.dto';
import { applyCommonFilters } from 'src/common/pagination/applyCommonFilters';
import { productFieldMapping } from 'src/common/pagination/fillters/product-filed-mapping';
import { applySorting } from 'src/common/pagination/apply_sort';
import { applyPagination } from 'src/common/pagination/applyPagination';
import { buildPaginationResponse } from 'src/common/pagination/pagination-response';
import { ProductTypeEnum } from 'src/common/enums/product.enum';


@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Combo)
    private readonly comboRepository: Repository<Combo>,
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>,
    @InjectRepository(Drink)
    private readonly drinkRepository: Repository<Drink>,
  ) { }

  async getAllProductsUser() {
    // 1. Lấy tất cả sản phẩm
    const products = await this.productRepository.find({
      where: { is_deleted: false },
    });

    // 2. Lấy tất cả combos trong DB (không filter theo category vì data không consistent)
    const allCombos = await this.comboRepository.find();

    // 3. Tạo Map để ánh xạ id => discount
    const comboMap = new Map(allCombos.map(combo => [combo.id, combo.discount]));

    // 4. Trả về mảng sản phẩm, thêm discount nếu có trong combo map
    return products.map((product) => ({
      ...product,
      discount: comboMap.get(product.id) || 0,
    }));
  }


  async getAllProducts(fillters: ProductPaginationDto) {
    const qb = this.productRepository.createQueryBuilder('product');

    applyCommonFilters(qb, fillters, productFieldMapping);

    const allowedFields = [
      'product.name',
      'product.price',
      'product.type',
      'product.category',
    ];
    applySorting(
      qb,
      fillters.sortBy,
      fillters.sortOrder,
      allowedFields,
      'product.name',
    );
    applyPagination(qb, {
      page: fillters.page,
      take: fillters.take,
    });
    const [products, total] = await qb.getManyAndCount();

    // Lấy tất cả combos trong DB (không filter theo category vì data không consistent)
    const allCombos = await this.comboRepository.find();

    // Tạo map từ combo data
    const comboMap = new Map(allCombos.map(combo => [combo.id, combo.discount]));

    // Enhance products với discount từ combo map
    const enhancedProducts = products.map(product => ({
      ...product,
      discount: comboMap.get(product.id) || 0
    }));

    const counts: { activeCount: number; deletedCount: number } = await this.productRepository
      .createQueryBuilder('product')
      .select([
        `SUM(CASE WHEN product.is_deleted = false THEN 1 ELSE 0 END) AS activeCount`,
        `SUM(CASE WHEN product.is_deleted = true THEN 1 ELSE 0 END) AS deletedCount`,
      ])
      .getRawOne() || { activeCount: 0, deletedCount: 0 };
    const activeCount = Number(counts.activeCount) || 0;
    const deletedCount = Number(counts.deletedCount) || 0;
    return buildPaginationResponse(enhancedProducts, {
      total,
      page: fillters.page,
      take: fillters.take,
      activeCount,
      deletedCount,
    });
  }

  async getProductById(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product not found with ID: ${id}`);
    }

    // 2. Nếu không phải combo thì return luôn
    if (product.category.toLowerCase() !== ProductTypeEnum.COMBO) {
      return {
        ...product,
        discount: null,
      };
    }

    // 3. Nếu là combo, truy vấn để lấy discount từ comboRepository
    const combo = await this.comboRepository.findOne({ where: { id } });

    return {
      ...product,
      discount: combo?.discount ?? null,
    };
  }

  async createProduct(dto: CreateProductDto) {
    // check trùng name 
    const existingProduct = await this.productRepository.findOne({
      where: { name: dto.name, is_deleted: false },
    });
    if (existingProduct) {
      throw new BadRequestException('Product with this name already exists');
    }

    // Tạo product dựa trên category
    let savedProduct: Product | Combo | Food | Drink;
    
    if (dto.category === ProductTypeEnum.COMBO) {
      // Tạo combo với discount
      const combo = new Combo();
      Object.assign(combo, dto);
      combo.discount = dto.discount || undefined;
      savedProduct = await this.comboRepository.save(combo);
    } else if (dto.category === ProductTypeEnum.FOOD) {
      // Tạo food
      const food = new Food();
      Object.assign(food, dto);
      savedProduct = await this.foodRepository.save(food);
    } else if (dto.category === ProductTypeEnum.DRINK) {
      // Tạo drink
      const drink = new Drink();
      Object.assign(drink, dto);
      savedProduct = await this.drinkRepository.save(drink);
    } else {
      // Default: tạo product thông thường
      savedProduct = await this.productRepository.save(dto);
    }

    return { msg: 'Product created successfully'};
  }
  async updateProduct(id: number, dto: UpdateProductDto) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    try {
      // Cập nhật dựa trên category hiện tại của product
      if (product.category === ProductTypeEnum.COMBO) {
        const combo = await this.comboRepository.findOne({ where: { id } });
        if (combo) {
          Object.assign(combo, dto);
          if (dto.discount !== undefined) {
            combo.discount = dto.discount;
          }
          await this.comboRepository.save(combo);
        }
      } else if (product.category === ProductTypeEnum.FOOD) {
        const food = await this.foodRepository.findOne({ where: { id } });
        if (food) {
          Object.assign(food, dto);
          await this.foodRepository.save(food);
        }
      } else if (product.category === ProductTypeEnum.DRINK) {
        const drink = await this.drinkRepository.findOne({ where: { id } });
        if (drink) {
          Object.assign(drink, dto);
          await this.drinkRepository.save(drink);
        }
      } else {
        // Default: update product thông thường
        Object.assign(product, dto);
        await this.productRepository.save(product);
      }
    } catch (error) {
      throw new BadRequestException('Failed to update product - ' + error.message);
    }
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
