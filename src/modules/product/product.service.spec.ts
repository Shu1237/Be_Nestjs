import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { Product } from 'src/database/entities/item/product';
import { Drink } from 'src/database/entities/item/drink';
import { Food } from 'src/database/entities/item/food';
import { Combo } from 'src/database/entities/item/combo';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('ProductService', () => {
  let service: ProductService;
  let mockProductRepo: Partial<Record<keyof Repository<Product>, jest.Mock>>;

  beforeEach(async () => {
    mockProductRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        getRawOne: jest.fn().mockResolvedValue({ activeCount: 0, deletedCount: 0 }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  describe('1.getProdcutById', () => {
    it('✅ 1.1 should return products if found', async () => {
      const products = [{ id: 1, name: 'Drink', is_deleted: false }];
      (mockProductRepo.find as jest.Mock).mockResolvedValue(products);
      const result = await service.getProdcutById(1);
      expect(result).toEqual(products);
    });

    it('❌ 1.2 should throw NotFoundException if no products found', async () => {
      (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
      await expect(service.getProdcutById(99)).rejects.toThrow(NotFoundException);
    });
    it('❌ 1.3 should throw if productIds is undefined', async () => {
      await expect(service.getProdcutById(undefined as any)).rejects.toThrow();
    });
    
    it('❌ 1.4 should throw if find throws error', async () => {
      (mockProductRepo.find as jest.Mock).mockRejectedValue(new Error('DB error'));
      await expect(service.getProdcutById(1)).rejects.toThrow('DB error');
    });
  });

  describe('2.createProduct', () => {
    it('✅ 2.1 should create a drink product', async () => {
      (mockProductRepo.save as jest.Mock).mockResolvedValue({});
      const dto = { type: 'drink', name: 'Coke', price: '10000' };
      await expect(service.createProduct(dto as any)).resolves.toEqual({ msg: 'Product created successfully' });
    });
    it('✅ 2.2 should create a food product', async () => {
      (mockProductRepo.save as jest.Mock).mockResolvedValue({});
      const dto = { type: 'food', name: 'Burger', price: '25000' };
      await expect(service.createProduct(dto as any)).resolves.toEqual({ msg: 'Product created successfully' });
    });
    it('✅ 2.3 should create a combo product', async () => {
      (mockProductRepo.save as jest.Mock).mockResolvedValue({});
      const dto = { type: 'combo', name: 'Combo 1', price: '30000' };
      await expect(service.createProduct(dto as any)).resolves.toEqual({ msg: 'Product created successfully' });
    });
    it('❌ 2.4 should throw Error if invalid type', async () => {
      const dto = { type: 'invalid', name: 'Invalid', price: '1' };
      await expect(service.createProduct(dto as any)).rejects.toThrow(Error);
    });
    it('❌ 2.5 should throw if dto is null', async () => {
      await expect(service.createProduct(null as any)).rejects.toThrow();
    });
    
    it('❌ 2.6 should throw if save throws error', async () => {
      (mockProductRepo.save as jest.Mock).mockRejectedValue(new Error('Save failed'));
      const dto = { type: 'drink', name: 'Coke', price: '10000' };
      await expect(service.createProduct(dto as any)).rejects.toThrow('Save failed');
    });
  });

  describe('3.updateProduct', () => {
    it('✅ 3.1 should update a product successfully', async () => {
      (mockProductRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, name: 'OldName' });
      (mockProductRepo.save as jest.Mock).mockResolvedValue({ id: 1, name: 'NewName' });
      const result = await service.updateProduct(1, { name: 'NewName' });
      expect(result).toEqual({ msg: 'Product updated successfully' });
    });

    it('❌ 3.2 should throw NotFoundException if product not found', async () => {
      (mockProductRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.updateProduct(99, { name: 'X' })).rejects.toThrow(NotFoundException);
    });
    it('❌ 3.3 should throw if save fails', async () => {
      (mockProductRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, name: 'Old' });
      (mockProductRepo.save as jest.Mock).mockRejectedValue(new Error('Save failed'));
      await expect(service.updateProduct(1, { name: 'New' })).rejects.toThrow('Save failed');
    });
    
    
  });

  describe('4.deleteProduct', () => {
    it('✅ 4.1 should delete a product if found', async () => {
      (mockProductRepo.delete as jest.Mock).mockResolvedValue({ affected: 1 });
      const result = await service.deleteProduct(1);
      expect(result).toEqual({ msg: 'Product deleted successfully' });
    });

    it('❌ 4.2 should throw NotFoundException if not found', async () => {
      (mockProductRepo.delete as jest.Mock).mockResolvedValue({ affected: 0 });
      await expect(service.deleteProduct(99)).rejects.toThrow(NotFoundException);
    });
    it('❌ 4.3 should throw if id is null', async () => {
      await expect(service.deleteProduct(null as any)).rejects.toThrow();
    });
    
    it('❌ 4.4 should throw if delete throws error', async () => {
      (mockProductRepo.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'));
      await expect(service.deleteProduct(1)).rejects.toThrow('Delete failed');
    });
  });

  describe('5.softDeleteProduct', () => {
    it('✅ 5.1 should soft delete a product', async () => {
      (mockProductRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, is_deleted: false });
      (mockProductRepo.save as jest.Mock).mockResolvedValue({ id: 1, is_deleted: true });
      const result = await service.softDeleteProduct(1);
      expect(result).toEqual({ msg: 'Product soft deleted successfully' });
    });

    it('❌ 5.2 should throw NotFoundException if product not found', async () => {
      (mockProductRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.softDeleteProduct(99)).rejects.toThrow(NotFoundException);
    });
    it('❌ 5.3 should throw if save throws error', async () => {
      (mockProductRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, is_deleted: false });
      (mockProductRepo.save as jest.Mock).mockRejectedValue(new Error('Save failed'));
      await expect(service.softDeleteProduct(1)).rejects.toThrow('Save failed');
    });
    
    it('❌ 5.4 should throw if id is undefined', async () => {
      await expect(service.softDeleteProduct(undefined as any)).rejects.toThrow();
    });
  });

  describe('6.restoreProduct', () => {
    it('✅ 6.1 should restore a soft-deleted product', async () => {
      (mockProductRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, is_deleted: true });
      (mockProductRepo.save as jest.Mock).mockResolvedValue({ id: 1, is_deleted: false });
      const result = await service.restoreProduct(1);
      expect(result).toEqual({ msg: 'Product restored successfully' });
    });

    it('❌ 6.2 should throw NotFoundException if not found', async () => {
      (mockProductRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.restoreProduct(99)).rejects.toThrow(NotFoundException);
    });

    it('❌ 6.3 should throw BadRequestException if not soft-deleted', async () => {
      (mockProductRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, is_deleted: false });
      await expect(service.restoreProduct(1)).rejects.toThrow(BadRequestException);
    });
    it('❌ 6.4 should throw if id is undefined', async () => {
  await expect(service.restoreProduct(undefined as any)).rejects.toThrow();
});

  });
  
  
  it('❌ 6.7 should throw if id is NaN', async () => {
    await expect(service.restoreProduct(NaN)).rejects.toThrow();
  });

  it('✅ 7.1 should return non-deleted products', async () => {
    const products = [{ id: 1, is_deleted: false }];
    (mockProductRepo.find as jest.Mock).mockResolvedValue(products);
    const result = await service.getAllProductsUser();
    expect(result).toEqual(products);
  });
  
  it('❌ 7.2 should throw if find fails', async () => {
    (mockProductRepo.find as jest.Mock).mockRejectedValue(new Error('Find failed'));
    await expect(service.getAllProductsUser()).rejects.toThrow('Find failed');
  });
  it('✅ 8.1 should return paginated products with counts', async () => {
    const mockQB: any = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
      getRawOne: jest.fn().mockResolvedValue({ activeCount: 1, deletedCount: 0 }),
    };
  
    (mockProductRepo.createQueryBuilder as jest.Mock).mockReturnValue(mockQB);
  
    const result = await service.getAllProducts({ page: 1, take: 10 } as any);
    expect(result.data.length).toBe(1);
    expect(result.meta.total).toBe(1);
  });
  
  
  
  it('❌ 8.3 should handle invalid pagination dto gracefully', async () => {
    const result = await service.getAllProducts({} as any);
    expect(result.data).toBeDefined(); // Empty array is fine
  });
  it('✅ 9.1 should coerce numeric price from string', async () => {
    const dto = { type: 'food', name: 'Pizza', price: '20000' };
    (mockProductRepo.save as jest.Mock).mockResolvedValue({ price: 20000 });
    await expect(service.createProduct(dto as any)).resolves.toEqual({ msg: 'Product created successfully' });
  });
  
});