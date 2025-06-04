import { Controller, Get, Post, Body, Param, ParseIntPipe, Patch, Delete, Put, UseGuards, Req } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { JwtAuthGuard } from 'src/guards/jwt.guard';


@UseGuards(JwtAuthGuard)
@Controller('promotion')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) { }


  @Get()
  getAllPromotions() {
    return this.promotionService.getAllPromotions();
  }

  // @Post()
  // createPromotion(@Body() createPromotionDto: CreatePromotionDto) {
  //   return this.promotionService.createPromotion(createPromotionDto);
  // }
  @Get(':id')
  getPromotionById(@Param('id', ParseIntPipe) id: number) {
    return this.promotionService.getPromotionById(id);
  }
  // @Put(':id')
  // updatePromotion(@Param('id', ParseIntPipe) id: number, @Body() updatePromotionDto: UpdatePromotionDto) {
  //   return this.promotionService.updatePromotion(id, updatePromotionDto);
  // }
  @Delete(':id')
  deletePromotion(@Param('id', ParseIntPipe) id: number) {
    return this.promotionService.deletePromotion(id);
  }
  @Patch(':id/')
  deleteSoftPromotion(@Param('id', ParseIntPipe) id: number) {
    return this.promotionService.deleteSoftPromotion(id);
  }

  // @Post('changePromotion')
  // changePromotion(@Body() body: { id: number, exchange: number }, @Req() req) {
  //   return this.promotionService.changePromotion(body, req.user);
  // }
}
