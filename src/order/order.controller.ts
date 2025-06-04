import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, Res } from '@nestjs/common';
import { OrderService } from './order.service';
import { MomoService } from './payment-menthod/momo/momo.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { Response } from 'express';
import { CreateOrderBillDto } from './dto/order-bill.dto';
import { ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';



@Controller('order')

export class OrderController {
  constructor(private readonly orderService: OrderService,
    private readonly momoService: MomoService
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


  @Get('payment/return')
  @ApiOperation({ summary: 'Handle MoMo payment return' })
  @ApiResponse({ status: 200, description: 'Return from MoMo handled' })
  async handleMomoReturn(@Query() query: any, @Res() res: Response) {
    const result = await this.momoService.handleReturn(res, query);
    return res.send(result);
  }


}

