import { Controller, Get, Param, ParseIntPipe, UseGuards } from "@nestjs/common";
import { ProductService } from "./product.service";
import { JwtAuthGuard } from "src/guards/jwt.guard";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";


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
    getProdcutById(@Param('id',ParseIntPipe) id: number) {
        return  this.productService.getProdcutById(id)
    }



}