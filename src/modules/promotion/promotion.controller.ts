import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { ApiBearerAuth, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';
import { PromotionPaginationDto } from 'src/common/pagination/dto/promotion/promotionPagination.dto';


@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('promotion')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) { }
  
  @Get('user')
  @ApiOperation({ summary: 'Get all promotions for users' })
  async getAllPromotionsUser() {
    return await this.promotionService.getAllPromotionsUser();
  }
  @Get('admin')
  @ApiOperation({ summary: 'Get all promotions for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'exchange', required: false, type: Number, example: 500 })
  @ApiQuery({ name: 'exchangeFrom', required: false, type: Number, example: 100 })
  @ApiQuery({ name: 'exchangeTo', required: false, type: Number, example: 1000 })
  @ApiQuery({ name: 'promotion_type_id', required: false, type: Number, example: 2 })
  @ApiQuery({ name: 'startTime', required: false, type: String, example: '2025-07-01' })
  @ApiQuery({ name: 'endTime', required: false, type: String, example: '2025-07-31' })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean, example: true })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'summer-sale' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'promotion.start_time' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], example: 'DESC' })
  getAllPromotions(@Query() query: PromotionPaginationDto, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can access this endpoint.');
    const {
      page = 1,
      take = 10,
      ...restFilters
    } = query;
    return this.promotionService.getAllPromotions({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  
  @Post()
  @ApiOperation({ summary: 'Create new promotion (admin only)' })
  @ApiBody({ type: CreatePromotionDto })
  createPromotion(
    @Body() createPromotionDto: CreatePromotionDto,
    @Req() req,
  ) {
    checkAdminEmployeeRole(req.user, 'Only admin can create promotions');
    return this.promotionService.createPromotion(createPromotionDto);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get promotion by ID' })
  getPromotionById(@Param('id', ParseIntPipe) id: number) {
    return this.promotionService.getPromotionById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update promotion by ID (admin only)' })
  @ApiBody({ type: UpdatePromotionDto })
  updatePromotion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePromotionDto: UpdatePromotionDto,
    @Req() req,
  ) {
    checkAdminEmployeeRole(req.user, 'Only admin can update promotions');
    return this.promotionService.updatePromotion(id, updatePromotionDto);
  }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete promotion by ID (admin only)' })
  // async deletePromotion(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Req() req: Request,
  // ) {
  //   const user = req.user as JWTUserType;
  //   if (user.role_id === Role.ADMIN) {
  //     return this.promotionService.deletePromotion(id);
  //   }
  //   throw new ForbiddenException('Only admin can delete promotions');
  // }

  @Patch(':id')
  @ApiOperation({ summary: 'Soft delete promotion by ID (admin only)' })
  async deleteSoftPromotion(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ) {
    checkAdminEmployeeRole(req.user, 'Only admin can delete promotions');
    return this.promotionService.deleteSoftPromotion(id);
  }
}

