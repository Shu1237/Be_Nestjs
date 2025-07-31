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
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentMethodService } from './payment-method.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';

@ApiTags('Payment Methods')
@ApiBearerAuth()
@Controller('payment-methods')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({
    summary: 'Tạo phương thức thanh toán mới (admin, employee only)',
  })
  create(@Body() createDto: CreatePaymentMethodDto) {
    return this.paymentMethodService.create(createDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Put(':id')
  @ApiOperation({
    summary: 'Cập nhật phương thức thanh toán (admin, employee only)',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodService.update(id, updateDto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id')
  @ApiOperation({
    summary: 'Xóa mềm phương thức thanh toán (admin, employee only)',
  })
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.paymentMethodService.softDelete(id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa phương thức thanh toán (admin, employee only)',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentMethodService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/restore')
  @ApiOperation({
    summary:
      'Khôi phục phương thức thanh toán đã xóa mềm (admin, employee only)',
  })
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.paymentMethodService.restore(id);
  }
}
