import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ProductService } from "./product.service";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Role } from "src/common/enums/roles.enum";
import { JWTUserType } from "src/common/utils/type";
import { CreateProductDto } from "./dto/createProdcut.dto";
import { UpdateProductDto } from "./dto/updateProduct.dto";


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
        const user = req.user as JWTUserType;
        if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
            throw new ForbiddenException(
                'Unauthorized: Only admin or employee can create a product.',
            );
        }
        return this.productService.createProduct(dto);
    }
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
        return this.productService.updateProduct(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Hard delete a product by ID (admin, employee only)' })
    async deleteProduct(@Param('id', ParseIntPipe) id: number, @Req() req) {
        const user = req.user as JWTUserType;
        if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
            throw new ForbiddenException(
                'Unauthorized: Only admin or employee can delete a product.',
            );
        }
        return this.productService.deleteProduct(id);
    }




}