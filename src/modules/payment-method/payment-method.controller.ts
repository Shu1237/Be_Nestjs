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
  Req,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentMethodService } from './payment-method.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';

@ApiTags('Payment Methods')
@ApiBearerAuth()
@Controller('payment-methods')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Tạo phương thức thanh toán mới (admin, employee only)',
  })
  create(@Body() createDto: CreatePaymentMethodDto, @Req() req) {
    checkAdminEmployeeRole(
      req.user,
      'Unauthorized: Only admin or employee can create a payment method.',
    );
    return this.paymentMethodService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả phương thức thanh toán' })
  findAll() {
    return this.paymentMethodService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy phương thức thanh toán theo ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentMethodService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({
    summary: 'Cập nhật phương thức thanh toán (admin, employee only)',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePaymentMethodDto,
    @Req() req,
  ) {
    checkAdminEmployeeRole(
      req.user,
      'Unauthorized: Only admin or employee can update a payment method.',
    );
    return this.paymentMethodService.update(id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa phương thức thanh toán (admin, employee only)',
  })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    checkAdminEmployeeRole(
      req.user,
      'Unauthorized: Only admin or employee can delete a payment method.',
    );
    return this.paymentMethodService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Xóa mềm phương thức thanh toán (admin, employee only)',
  })
  async softDelete(@Param('id', ParseIntPipe) id: number, @Req() req) {
    checkAdminEmployeeRole(
      req.user,
      'Unauthorized: Only admin or employee can soft delete a payment method.',
    );
    return this.paymentMethodService.softDelete(id);
  }
}