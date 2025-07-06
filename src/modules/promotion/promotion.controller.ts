import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Patch,
  // Delete,
  Put,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { ApiBearerAuth, ApiOperation, ApiBody, ApiTags } from '@nestjs/swagger';
import { ChangePromotionDto } from './dto/change-promotion.dto';
import { Request } from 'express';
import { JWTUserType } from 'src/common/utils/type';
import { Role } from 'src/common/enums/roles.enum';
import { ForbiddenException } from 'src/common/exceptions/forbidden.exception';
import { PaginationDto } from './dto/pagination.dto';

@ApiTags('Promotions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('promotion')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all promotions with pagination' })
  getAllPromotions(@Query() paginationDto: PaginationDto) {
    return this.promotionService.getAllPromotions(paginationDto);
  }

  @Post('changePromotion')
  @ApiOperation({ summary: 'Đổi điểm lấy mã khuyến mãi' })
  @ApiBody({ type: ChangePromotionDto })
  changePromotion(@Body() body: ChangePromotionDto, @Req() req: Request) {
    const user = req.user as JWTUserType;
    return this.promotionService.changePromotion(body, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create new promotion (admin only)' })
  @ApiBody({ type: CreatePromotionDto })
  createPromotion(
    @Body() createPromotionDto: CreatePromotionDto,
    @Req() req: Request,
  ) {
    const user = req.user as JWTUserType;
    if (user.role_id === Role.ADMIN) {
      return this.promotionService.createPromotion(createPromotionDto);
    }
    throw new ForbiddenException('Only admin can create promotions');
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
    @Req() req: Request,
  ) {
    const user = req.user as JWTUserType;
    if (user.role_id === Role.ADMIN) {
      return this.promotionService.updatePromotion(id, updatePromotionDto);
    }
    throw new ForbiddenException('Only admin can update promotions');
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
    @Req() req: Request,
  ) {
    const user = req.user as JWTUserType;
    if (user.role_id === Role.ADMIN) {
      return this.promotionService.deleteSoftPromotion(id);
    }
    throw new ForbiddenException('Only admin can delete promotions');
  }
}
