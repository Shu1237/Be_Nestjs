import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChangePromotionDto } from './dto/change-promotion.dto';
import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { JWTUserType } from 'src/utils/type';
import { Role } from 'src/enum/roles.enum';

interface RequestWithUser extends Request {
  user: JWTUserType;
}

@ApiTags('Promotions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('promotion')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all promotions' })
  @ApiResponse({
    status: 200,
    description: 'List of all promotions',
  })
  getAllPromotions() {
    return this.promotionService.getAllPromotions();
  }

  @Post('changePromotion')
  @ApiOperation({ summary: 'Đổi điểm lấy mã khuyến mãi' })
  @ApiBody({ type: ChangePromotionDto })
  changePromotion(
    @Body() body: ChangePromotionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.promotionService.changePromotion(body, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create new promotion (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Promotion created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin can create promotions',
  })
  @ApiBody({ type: CreatePromotionDto })
  createPromotion(
    @Body() createPromotionDto: CreatePromotionDto,
    @Req() req: RequestWithUser,
  ) {
    if (req.user.role_id === Role.ADMIN) {
      return this.promotionService.createPromotion(createPromotionDto);
    }
    throw new ForbiddenException('Only admin can create promotions');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get promotion by ID' })
  @ApiResponse({
    status: 200,
    description: 'Promotion found',
  })
  @ApiResponse({
    status: 404,
    description: 'Promotion not found',
  })
  getPromotionById(@Param('id', ParseIntPipe) id: number) {
    return this.promotionService.getPromotionById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update promotion by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Promotion updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin can update promotions',
  })
  @ApiResponse({
    status: 404,
    description: 'Promotion not found',
  })
  @ApiBody({ type: UpdatePromotionDto })
  updatePromotion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePromotionDto: UpdatePromotionDto,
    @Req() req: RequestWithUser,
  ) {
    if (req.user.role_id === Role.ADMIN) {
      return this.promotionService.updatePromotion(id, updatePromotionDto);
    }
    throw new ForbiddenException('Only admin can update promotions');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete promotion by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Promotion deleted successfully.',
    example: {
      msg: 'Delete successfully',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Promotion not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin can delete promotions',
  })
  async deletePromotion(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    if (user.role_id === Role.ADMIN) {
      await this.promotionService.deletePromotion(id);
      return { msg: 'Delete successfully' };
    }
    throw new ForbiddenException('Only admin can delete promotions');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Soft delete promotion by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Promotion soft deleted successfully.',
    example: {
      msg: 'Delete successfully',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Promotion not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only admin can delete promotions',
  })
  async deleteSoftPromotion(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    if (user.role_id === Role.ADMIN) {
      await this.promotionService.deleteSoftPromotion(id);
      return { msg: 'Delete successfully' };
    }
    throw new ForbiddenException('Only admin can delete promotions');
  }
}
