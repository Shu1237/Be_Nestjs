import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards, Patch } from "@nestjs/common";
import { ProductService } from "./product.service";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { CreateProductDto } from "./dto/createProdcut.dto";
import { UpdateProductDto } from "./dto/updateProduct.dto";
import { checkAdminEmployeeRole } from "src/common/role/admin_employee";


@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('products')
export class ProductController {
    constructor(
        private readonly productService: ProductService
    ) { }
    @Get()
    @ApiOperation({ summary: 'Get all products' })
    getAllProducts() {
        return this.productService.getAllProducts();
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

    @Patch(':id/soft-delete')
    @ApiOperation({ summary: 'Soft delete a product by ID (admin, employee only)' })
    async softDeleteProduct(@Param('id', ParseIntPipe) id: number, @Req() req) {
        checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can soft delete a product.');
        return this.productService.softDeleteProduct(id);
    }

    @Patch(':id/restore')
    @ApiOperation({ summary: 'Restore a soft-deleted product by ID (admin, employee only)' })
    async restoreProduct(@Param('id', ParseIntPipe) id: number, @Req() req) {
        checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can restore a product.');
        return this.productService.restoreProduct(id);
    }




}