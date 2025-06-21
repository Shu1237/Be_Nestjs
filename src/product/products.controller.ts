import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  UseGuards,
  Patch,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './product.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { Role } from 'src/enum/roles.enum';
import { JWTUserType } from 'src/utils/type';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  async createProduct(@Body() dto: CreateProductDto, @Req() req) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin or employee can create a product.',
      );
    }
    return this.productsService.createProduct(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  getAllProducts() {
    return this.productsService.getAllProducts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  getProductById(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getProductById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update product by ID (admin, employee only)' })
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @Req() req,
  ) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin or employee can update a product.',
      );
    }
    return this.productsService.updateProduct(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Hard delete a product by ID (admin, employee only)' })
  async deleteProduct(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin or employee can delete a product.',
      );
    }
    return this.productsService.deleteProduct(id);
  }

  // Nếu muốn soft delete, bạn có thể bổ sung tương tự như movie
}