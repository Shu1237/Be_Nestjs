import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CreateProductDto } from './dto/createProdcut.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';
import { ProductPaginationDto } from 'src/common/pagination/dto/product/productPagination.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  // GET - Lấy danh sách products cho user
  @Get('user')
  @ApiOperation({ summary: 'Get all products for users' })
  async getAllProductsUser() {
    return await this.productService.getAllProductsUser();
  }

  // GET - Lấy danh sách products cho admin (với phân trang và filter)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('admin')
  @ApiOperation({ summary: 'Get all products for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Pizza' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'product.name',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    example: 'food',
  })
  @ApiQuery({ name: 'type', required: false, type: String, example: 'main' })
  @ApiQuery({
    name: 'is_deleted',
    required: false,
    type: Boolean,
    example: false,
  })
  getAllProducts(@Query() query: ProductPaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;
    return this.productService.getAllProducts({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - Lấy product theo ID
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  getProductById(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getProductById(id);
  }

  // POST - Tạo product mới
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productService.createProduct(dto);
  }

  // PUT - Cập nhật product theo ID
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Put(':id')
  @ApiOperation({ summary: 'Update product by ID (admin, employee only)' })
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {

    return this.productService.updateProduct(id, dto);
  }

  // DELETE - Xóa product theo ID
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Delete(':id')
  @ApiOperation({
    summary: 'Hard delete a product by ID (admin, employee only)',
  })
  async deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.deleteProduct(id);
  }


  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/soft-delete')
  @ApiOperation({
    summary: 'Soft delete a product by ID (admin, employee only)',
  })
  async softDeleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.softDeleteProduct(id);
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted product by ID (admin, employee only)',
  })
  async restoreProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.restoreProduct(id);
  }
}
