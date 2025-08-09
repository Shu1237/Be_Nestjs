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
  constructor(private readonly paymentMethodService: PaymentMethodService) { }

  // GET - Get all payment methods for users
  @Get()
  @ApiOperation({ summary: 'Get all payment methods' })
  findAll() {
    return this.paymentMethodService.findAll();
  }
  // GET - Get payment method by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get payment method by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentMethodService.findOne(id);
  }

  // POST - Create a new payment method (admin, employee only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({
    summary: 'Create a new payment method (admin, employee only)',
  })
  create(@Body() createDto: CreatePaymentMethodDto) {
    return this.paymentMethodService.create(createDto);
  }

  // PUT
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Put(':id')
  @ApiOperation({
    summary: 'Update payment method (admin, employee only)',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodService.update(id, updateDto);
  }
  // PATCH - Soft delete payment method (admin, employee only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id')
  @ApiOperation({
    summary: 'Soft delete payment method (admin, employee only)',
  })
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.paymentMethodService.softDelete(id);
  }

  // DELETE - Permanently delete payment method (admin, employee only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete payment method (admin, employee only)',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentMethodService.remove(id);
  }
  // PATCH - Restore soft-deleted payment method (admin, employee only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/restore')
  @ApiOperation({
    summary:
      'Restore soft-deleted payment method (admin, employee only)',
  })
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.paymentMethodService.restore(id);
  }
}
