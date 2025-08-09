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
  Query,
} from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { PromotionPaginationDto } from 'src/common/pagination/dto/promotion/promotionPagination.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';

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

  // GET - Get list of promotions for admin (with pagination)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('admin')
  @ApiOperation({ summary: 'Get all promotions for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'exchange', required: false, type: Number, example: 500 })
  @ApiQuery({
    name: 'exchangeFrom',
    required: false,
    type: Number,
    example: 100,
  })
  @ApiQuery({
    name: 'exchangeTo',
    required: false,
    type: Number,
    example: 1000,
  })
  @ApiQuery({
    name: 'promotion_type_id',
    required: false,
    type: Number,
    example: 2,
  })
  @ApiQuery({
    name: 'startTime',
    required: false,
    type: String,
    example: '2025-07-01',
  })
  @ApiQuery({
    name: 'endTime',
    required: false,
    type: String,
    example: '2025-07-31',
  })
  @ApiQuery({
    name: 'is_active',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'summer-sale',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'promotion.start_time',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  getAllPromotions(@Query() query: PromotionPaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;
    return this.promotionService.getAllPromotions({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({ summary: 'Create new promotion (admin only)' })
  @ApiBody({ type: CreatePromotionDto })
  createPromotion(@Body() createPromotionDto: CreatePromotionDto) {
    return this.promotionService.createPromotion(createPromotionDto);
  }

  // PUT - Update promotion by ID
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Put(':id')
  @ApiOperation({ summary: 'Update promotion by ID (admin only)' })
  @ApiBody({ type: UpdatePromotionDto })
  updatePromotion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ) {
    return this.promotionService.updatePromotion(id, updatePromotionDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle promotion status (activate/deactivate) by ID (Admin only)' })
  togglePromotionStatus(@Param('id', ParseIntPipe) id: number) {
    return this.promotionService.togglePromotionStatus(id);
  }
}
