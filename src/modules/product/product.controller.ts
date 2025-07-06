import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ProductService } from "./product.service";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";
import { ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { CreateProductDto } from "./dto/createProdcut.dto";
import { UpdateProductDto } from "./dto/updateProduct.dto";
import { checkAdminEmployeeRole } from "src/common/role/admin_employee";
import { ProductPaginationDto } from "src/common/pagination/dto/product/productPagination.dto";


@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('products')
export class ProductController {
    constructor(
        private readonly productService: ProductService
    ) { }
    @Get()
    @ApiOperation({ summary: 'Get all products with filters, search, sort, and pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'search', required: false, type: String, example: 'Pizza' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'product.name' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], example: 'DESC' })
    @ApiQuery({ name: 'category', required: false, type: String, example: 'food' })
    @ApiQuery({ name: 'type', required: false, type: String, example: 'main' })
    @ApiQuery({ name: 'is_deleted', required: false, type: Boolean, example: false })
    getAllProducts(@Query() query: ProductPaginationDto) {
        const {
            page = 1,
            take = 10,
            ...restFilters
        } = query;
        return this.productService.getAllProducts({
            page,
            take: Math.min(take, 100),
            ...restFilters,
        });
    }


    @Get(':id')
    @ApiOperation({ summary: 'Get Prodcut By Id' })
    getProdcutById(@Param('id', ParseIntPipe) id: number) {
        return this.productService.getProdcutById(id)
    }



    @Post()
    @ApiOperation({ summary: 'Create a new product' })
    async createProduct(@Body() dto: CreateProductDto, @Req() req) {
        checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can create a product.');
        return this.productService.createProduct(dto);
    }
    @Put(':id')
    @ApiOperation({ summary: 'Update product by ID (admin, employee only)' })
    async updateProduct(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateProductDto,
        @Req() req,
    ) {
        checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can update a product.');
        return this.productService.updateProduct(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Hard delete a product by ID (admin, employee only)' })
    async deleteProduct(@Param('id', ParseIntPipe) id: number, @Req() req) {
        checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can delete a product.');
        return this.productService.deleteProduct(id);
    }




}