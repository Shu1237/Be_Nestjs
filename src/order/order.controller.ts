import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, Res } from '@nestjs/common';
import { OrderService } from './order.service';
import { MomoService } from './payment-menthod/momo/momo.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { JWTUserType } from 'src/utils/type';
import { Response } from 'express';



@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService,
    private readonly momoService: MomoService
  ) { }

  // @UseGuards(JwtAuthGuard)
  @Post()
  createOrder(@Req() req) {
    return this.orderService.createOrder(req.user);
  }

  // @Post('momo')
  // testMomoPayment() {
  //   const total = "1000000"; // Example total amount
  //   return this.momoService.createPayment(total);
  // }

  @Get('payment/return')
  async handleMomoReturn(@Query() query: any, @Res() res: Response) {
    try {
      const result = await this.momoService.handleReturn(query, res);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ message: 'Payment processing failed', error: error.message });
    }
  }


}

