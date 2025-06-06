import { Controller, Get, Post, Body, Query, Res, UseGuards, BadRequestException, InternalServerErrorException, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { MomoService } from './payment-menthod/momo/momo.service';
import { PayPalService } from './payment-menthod/paypal/paypal.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { Response } from 'express';
import { CreateOrderBillDto } from './dto/order-bill.dto';
import { ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VisaService } from './payment-menthod/visa/visa.service';

@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly momoService: MomoService,
    private readonly payPalService: PayPalService,
    private readonly visaService: VisaService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBearerAuth()
  @ApiBody({ type: CreateOrderBillDto })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  createOrder(@Body() body: CreateOrderBillDto, @Req() req) {
    return this.orderService.createOrder(req.user, body);
  }

  @Get('momo/return')
  @ApiOperation({ summary: 'Handle MoMo payment return' })
  @ApiResponse({ status: 200, description: 'Return from MoMo handled' })
  async handleMomoReturn(@Query() query: any, @Res() res: Response) {
    const result = await this.momoService.handleReturn(res, query);
    return res.send(result);
  }

  @Get('paypal/success/return')
  @ApiOperation({ summary: 'Handle PayPal payment success return' })
  @ApiResponse({ status: 200, description: 'Return from PayPal success handled' })
  async handlePaypalSuccess(
    @Query('token') orderId: string,
    @Query('PayerID') payerId: string,
    @Res() res: Response,
  ) {
    const result = await this.payPalService.handleReturnSuccessPaypal(orderId);
    if (!result) {
      throw new BadRequestException('Invalid order ID or Payer ID');
    }
    return res.send(result);
  }

  @Get('paypal/cancel/return')
  @ApiOperation({ summary: 'Handle PayPal payment cancel return' })
  @ApiResponse({ status: 200, description: 'Return from PayPal cancel handled' })
  async handlePaypalCancel(@Query('token') orderId: string, @Res() res: Response) {
    const result = await this.payPalService.handleReturnCancelPaypal(orderId);
    if (!result) {
      throw new BadRequestException('Invalid order ID');
    }
    return res.send(result);
  }




  // visa
  @Get('visa/success/return')
  async handleVisaSuccess(@Query('orderId') orderId: string, @Query('PayerID') payerId: string, @Res() res: Response) {
    const result = await this.payPalService.handleReturnSuccessPaypal(orderId);
    if (!result) {
      throw new BadRequestException('Invalid order ID or Payer ID');
    }
    return res.send(result);
  }

  @Get('visa/cancel/return')
  async handleVisaCancel(@Query('orderId') orderId: string, @Res() res: Response) {
    const result = await this.payPalService.handleReturnCancelPaypal(orderId);
    if (!result) {
      throw new BadRequestException('Invalid order ID');
    }
    return res.send(result);
  }
}