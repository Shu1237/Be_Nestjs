import { Controller, Get, Post, Body, Query, Res, UseGuards, BadRequestException, InternalServerErrorException, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { MomoService } from './payment-menthod/momo/momo.service';
import { PayPalService } from './payment-menthod/paypal/paypal.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { Response } from 'express';
import { CreateOrderBillDto } from './dto/order-bill.dto';
import { ApiOperation, ApiBody, ApiResponse, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { VnpayService } from './payment-menthod/vnpay/vnpay.service';
import { ZalopayService } from './payment-menthod/zalopay/zalopay.service';

@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly momoService: MomoService,
    private readonly payPalService: PayPalService,
    private readonly vnpayService: VnpayService,
    private readonly zalopayService: ZalopayService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBearerAuth()
  @ApiBody({ type: CreateOrderBillDto })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  createOrder(@Body() body: CreateOrderBillDto, @Req() req) {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (!clientIp) {
      throw new InternalServerErrorException('Client IP address not found');
    }
    return this.orderService.createOrder(req.user, body, clientIp);
  }

  @ApiExcludeEndpoint()
  @Get('momo/return')
  async handleMomoReturn(@Query() query: any, @Res() res: Response) {
    const result = await this.momoService.handleReturn(res, query);
    return res.send(result);
  }
  @ApiExcludeEndpoint()
  @Get('paypal/success/return')
  async handlePaypalSuccess(
    @Query('token') orderId: string,
    @Res() res: Response,
  ) {
    const result = await this.payPalService.handleReturnSuccessPaypal(orderId);
    if (!result) {
      throw new BadRequestException('Invalid order ID or Payer ID');
    }
    return res.send(result);
  }
  @ApiExcludeEndpoint()
  @Get('paypal/cancel/return')
  async handlePaypalCancel(@Query('token') orderId: string, @Res() res: Response) {
    const result = await this.payPalService.handleReturnCancelPaypal(orderId);
    if (!result) {
      throw new BadRequestException('Invalid order ID');
    }
    return res.send(result);
  }




  // visa
  @ApiExcludeEndpoint()
  @Get('visa/success/return')
  async handleVisaSuccess(@Query('orderId') orderId: string, @Query('PayerID') payerId: string, @Res() res: Response) {
    const result = await this.payPalService.handleReturnSuccessPaypal(orderId);
    if (!result) {
      throw new BadRequestException('Invalid order ID or Payer ID');
    }
    return res.send(result);
  }
  @ApiExcludeEndpoint()
  @Get('visa/cancel/return')
  async handleVisaCancel(@Query('orderId') orderId: string, @Res() res: Response) {
    const result = await this.payPalService.handleReturnCancelPaypal(orderId);
    if (!result) {
      throw new BadRequestException('Invalid order ID');
    }
    return res.send(result);
  }


  // VnPay
  @ApiExcludeEndpoint()
  @Get('vnpay/return')
  async handleVnPayReturn(@Query() query: any, @Res() res: Response) {
    const result = await this.vnpayService.handleReturnVnPay(query);
    return res.send(result);
  }


  // ZaloPay
  @ApiExcludeEndpoint()
  @Get('zalopay/return')
  async handleZaloPayReturn(@Query() query: any, @Res() res: Response) {
    const result = await this.zalopayService.handleReturnZaloPay(query);
    return res.send(result);
  }
}