import { Controller, Get, Post, Body, Query, Res, UseGuards, Req, Param, ParseIntPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { MomoService } from './payment-menthod/momo/momo.service';
import { PayPalService } from './payment-menthod/paypal/paypal.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { Response } from 'express';
import { CreateOrderBillDto } from './dto/order-bill.dto';
import { ApiOperation, ApiBody, ApiResponse, ApiBearerAuth, ApiExcludeEndpoint, ApiQuery } from '@nestjs/swagger';
import { VnpayService } from './payment-menthod/vnpay/vnpay.service';
import { ZalopayService } from './payment-menthod/zalopay/zalopay.service';
import { JWTUserType } from 'src/common/utils/type';
import { ScanQrCodeDto } from './dto/qrcode.dto';
import { InternalServerErrorException } from 'src/common/exceptions/internal-server-error.exception';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { GetAllOrdersDto } from './dto/getAllOrder.dto';
import { checkUserRole } from 'src/common/role/user';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';

@ApiBearerAuth()
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
    const result = await this.momoService.handleReturn(query);
    return res.redirect(result);
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
    return res.redirect(result);
  }
  @ApiExcludeEndpoint()
  @Get('paypal/cancel/return')
  async handlePaypalCancel(@Query('token') orderId: string, @Res() res: Response) {
    const result = await this.payPalService.handleReturnCancelPaypal(orderId);
    // if (!result) {
    //   throw new BadRequestException('Invalid order ID');
    // }
    return res.redirect(result);
  }




  // visa
  @ApiExcludeEndpoint()
  @Get('visa/success/return')
  async handleVisaSuccess(@Query('orderId') orderId: string, @Query('PayerID') payerId: string, @Res() res: Response) {
    const result = await this.payPalService.handleReturnSuccessPaypal(orderId);
    if (!result) {
      throw new BadRequestException('Invalid order ID or Payer ID');
    }
    return res.redirect(result);
  }
  @ApiExcludeEndpoint()
  @Get('visa/cancel/return')
  async handleVisaCancel(@Query('orderId') orderId: string, @Res() res: Response) {
    const result = await this.payPalService.handleReturnCancelPaypal(orderId);
    // if (!result) {
    //   throw new BadRequestException('Invalid order ID');
    // }
    return res.redirect(result);
  }


  // VnPay
  @ApiExcludeEndpoint()
  @Get('vnpay/return')
  async handleVnPayReturn(@Query() query: any, @Res() res: Response) {
    const result = await this.vnpayService.handleReturnVnPay(query);
    return res.redirect(result);
  }


  // ZaloPay
  @ApiExcludeEndpoint()
  @Get('zalopay/return')
  async handleZaloPayReturn(@Query() query: any, @Res() res: Response) {
    const result = await this.zalopayService.handleReturnZaloPay(query);
    return res.redirect(result);
  }



  // View All Orders
  @UseGuards(JwtAuthGuard)
  @Get('all')
  @ApiOperation({ summary: 'View all orders' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['all', ...Object.values(StatusOrder)], example: 'all', default: 'all', })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'search term' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2025-07-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2025-07-03' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], example: 'ASC' })
  @ApiQuery({ name: 'paymentMethod', required: false, type: String, example: 'momo' })
  @ApiResponse({ status: 200, description: 'List of all orders' })
  async getAllOrders(
    @Req() req,
    @Query() query: GetAllOrdersDto,
  ) {
    checkAdminEmployeeRole(req.user, 'You do not have permission to view all orders');
    const { page = 1, limit = 10, status, ...restFilters } = query;
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const statusValue: StatusOrder | undefined = status === 'all'
      ? undefined
      : status as StatusOrder;

    return this.orderService.getAllOrders({
      skip,
      take,
      page,
      ...restFilters,
      status: statusValue,
    });
  }



  // // Get Order by Id 
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'View Order by ID ' })
  async getMyOrder(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.orderService.getOrderByIdEmployeeAndAdmin(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getorderbyUserID/:id')
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['all', ...Object.values(StatusOrder)], example: 'all', default: 'all', })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'search term' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2025-07-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2025-07-03' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], example: 'ASC' })
  @ApiQuery({ name: 'paymentMethod', required: false, type: String, example: 'momo' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'View my orders' })
  async getMyOrders(
    @Param('id') id: string,
    @Req() req,
    @Query() query: GetAllOrdersDto,

  ) {
    const user = req.user as JWTUserType;
    // checkUserRole(user, 'You can only view your own orders', id.toString());
    const { page = 1, limit = 10, status, ...restFilters } = query;
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const statusValue: StatusOrder | undefined = status === 'all'
      ? undefined
      : status as StatusOrder;


    return this.orderService.getMyOrders({
      userId: user.account_id,
      skip,
      take,
      page,
      ...restFilters,
      status: statusValue,
    });
  }



  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get order by Order ID' })
  @ApiBody({ type: ScanQrCodeDto })
  @ApiBearerAuth()
  @Post('scan-qr')
  scanQrCode(@Body() data: ScanQrCodeDto,@Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can scan QR code.');
    return this.orderService.scanQrCode(data.qrCode);
  }





}
