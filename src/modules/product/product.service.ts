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


import { ProductPaginationDto } from 'src/common/pagination/dto/product/productPagination.dto';
import { applyCommonFilters } from 'src/common/pagination/applyCommonFilters';
import { productFieldMapping } from 'src/common/pagination/fillters/product-filed-mapping';
import { applySorting } from 'src/common/pagination/apply_sort';
import { applyPagination } from 'src/common/pagination/applyPagination';
import { buildPaginationResponse } from 'src/common/pagination/pagination-response';
import { ProductTypeEnum } from 'src/common/enums/product.enum';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';


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

  async getAllProductsUser(): Promise<(Product | Combo | Food | Drink)[]> {
    const products = await this.productRepository.find({
      where: { is_deleted: false },
    });
    const allCombos = await this.comboRepository.find();
    const comboMap = new Map(allCombos.map(combo => [combo.id, combo.discount]));
    return products.map((product) => ({
      ...product,
      discount: comboMap.get(product.id) ?? undefined,
    }));
  }


  async getAllProducts(fillters: ProductPaginationDto): Promise<ReturnType<typeof buildPaginationResponse>> {
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

    // Get all combos in DB (not filtered by category because data is inconsistent)
    const allCombos = await this.comboRepository.find();

    // Create map from combo data
    const comboMap = new Map(allCombos.map(combo => [combo.id, combo.discount]));

    // Enhance products with discount from combo map
    const enhancedProducts = products.map(product => ({
      ...product,
      discount: comboMap.get(product.id) ?? undefined
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

  async getProductById(id: number): Promise<Product | Combo | Food | Drink> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product not found with ID: ${id}`);
    }

    // 2. Nếu không phải combo thì return luôn
    if (product.category.toLowerCase() !== ProductTypeEnum.COMBO) {
      return {
        ...product,
        discount: undefined,
      };
    }

    // 3. Nếu là combo, truy vấn để lấy discount từ comboRepository
    const combo = await this.comboRepository.findOne({ where: { id } });

    return {
      ...product,
      discount: combo?.discount ?? undefined,
    };
  }

  async createProduct(dto: CreateProductDto): Promise<{ msg: string }> {
    // check name
    const existingProduct = await this.productRepository.findOne({
      where: { name: dto.name, is_deleted: false },
    });
    if (existingProduct) {
      throw new BadRequestException('Product with this name already exists');
    }

    // create product based on category
    let savedProduct: Product | Combo | Food | Drink;

    if (dto.category === ProductTypeEnum.COMBO) {
      // Create combo with discount
      const combo = new Combo();
      Object.assign(combo, dto);
      combo.discount = dto.discount || undefined;
      savedProduct = await this.comboRepository.save(combo);
    } else if (dto.category === ProductTypeEnum.FOOD) {
      // Create food
      const food = new Food();
      Object.assign(food, dto);
      savedProduct = await this.foodRepository.save(food);
    } else if (dto.category === ProductTypeEnum.DRINK) {
      // Create drink
      const drink = new Drink();
      Object.assign(drink, dto);
      savedProduct = await this.drinkRepository.save(drink);
    } else {
      // Default: create regular product
      savedProduct = await this.productRepository.save(dto);
    }

    return { msg: 'Product created successfully' };
  }
  async updateProduct(id: number, dto: UpdateProductDto): Promise<{ msg: string }> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    try {
      // Check if category is changing
      const isCategoryChanging = dto.category && dto.category !== product.category;

      if (isCategoryChanging) {
        // Handle category change - delete old entity and create new one
        await this.handleCategoryChange(id, product.category, dto);
      } else {
        // Update existing entity based on current category
        await this.updateExistingEntity(id, product.category, dto);
      }
    } catch (error) {
      throw new BadRequestException('Failed to update product - ' + error.message);
    }

    return { msg: 'Product updated successfully' };
  }

  private async updateExistingEntity(id: number, category: string, dto: UpdateProductDto): Promise<void> {
    switch (category) {
      case ProductTypeEnum.COMBO:
        const combo = await this.comboRepository.findOne({ where: { id } });
        if (!combo) throw new NotFoundException('Combo not found');
        Object.assign(combo, dto);
        await this.comboRepository.save(combo);
        break;

      case ProductTypeEnum.FOOD:
        const food = await this.foodRepository.findOne({ where: { id } });
        if (!food) throw new NotFoundException('Food not found');
        Object.assign(food, dto);
        await this.foodRepository.save(food);
        break;

      case ProductTypeEnum.DRINK:
        const drink = await this.drinkRepository.findOne({ where: { id } });
        if (!drink) throw new NotFoundException('Drink not found');
        Object.assign(drink, dto);
        await this.drinkRepository.save(drink);
        break;

      default:
        const product = await this.productRepository.findOne({ where: { id } });
        if (!product) throw new NotFoundException('Product not found');
        Object.assign(product, dto);
        await this.productRepository.save(product);
    }
  }

  private async handleCategoryChange(id: number, oldCategory: string, dto: UpdateProductDto): Promise<void> {
    // First delete from old table
    switch (oldCategory) {
      case ProductTypeEnum.COMBO:
        await this.comboRepository.delete(id);
        break;
      case ProductTypeEnum.FOOD:
        await this.foodRepository.delete(id);
        break;
      case ProductTypeEnum.DRINK:
        await this.drinkRepository.delete(id);
        break;
    }

    // Then create in new table
    switch (dto.category) {
      case ProductTypeEnum.COMBO:
        const combo = new Combo();
        Object.assign(combo, { id, ...dto });
        await this.comboRepository.save(combo);
        break;

      case ProductTypeEnum.FOOD:
        const food = new Food();
        Object.assign(food, { id, ...dto });
        await this.foodRepository.save(food);
        break;

      case ProductTypeEnum.DRINK:
        const drink = new Drink();
        Object.assign(drink, { id, ...dto });
        await this.drinkRepository.save(drink);
        break;

      default:
        const product = await this.productRepository.findOne({ where: { id } });
        if (product) {
          Object.assign(product, dto);
          await this.productRepository.save(product);
        }
    }
  }

  async deleteProduct(id: number): Promise<{ msg: string }> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Product not found');
    return { msg: 'Product deleted successfully' };
  }

  async softDeleteProduct(id: number) : Promise<{ msg: string }> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    // Soft delete in main product table
    product.is_deleted = true;
    await this.productRepository.save(product);

    // Also soft delete in specific entity table based on category
    await this.softDeleteSpecificEntity(id, product.category);

    return { msg: 'Product soft deleted successfully' };
  }

  async restoreProduct(id: number) : Promise<{ msg: string }> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (!product.is_deleted) {
      throw new BadRequestException('Product is not soft-deleted');
    }

    // Restore in main product table
    product.is_deleted = false;
    await this.productRepository.save(product);

    // Also restore in specific entity table based on category
    await this.restoreSpecificEntity(id, product.category);

    return { msg: 'Product restored successfully' };
  }

  private async softDeleteSpecificEntity(id: number, category: string): Promise<void> {
    switch (category) {
      case ProductTypeEnum.COMBO:
        const combo = await this.comboRepository.findOne({ where: { id } });
        if (combo) {
          combo.is_deleted = true;
          await this.comboRepository.save(combo);
        }
        break;

      case ProductTypeEnum.FOOD:
        const food = await this.foodRepository.findOne({ where: { id } });
        if (food) {
          food.is_deleted = true;
          await this.foodRepository.save(food);
        }
        break;

      case ProductTypeEnum.DRINK:
        const drink = await this.drinkRepository.findOne({ where: { id } });
        if (drink) {
          drink.is_deleted = true;
          await this.drinkRepository.save(drink);
        }
        break;
    }
  }

  private async restoreSpecificEntity(id: number, category: string): Promise<void> {
    switch (category) {
      case ProductTypeEnum.COMBO:
        const combo = await this.comboRepository.findOne({ where: { id } });
        if (combo) {
          combo.is_deleted = false;
          await this.comboRepository.save(combo);
        }
        break;

      case ProductTypeEnum.FOOD:
        const food = await this.foodRepository.findOne({ where: { id } });
        if (food) {
          food.is_deleted = false;
          await this.foodRepository.save(food);
        }
        break;

      case ProductTypeEnum.DRINK:
        const drink = await this.drinkRepository.findOne({ where: { id } });
        if (drink) {
          drink.is_deleted = false;
          await this.drinkRepository.save(drink);
        }
        break;
    }
  }
}
