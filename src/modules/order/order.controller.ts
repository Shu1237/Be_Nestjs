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
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';
import { OrderPaginationDto } from 'src/common/pagination/dto/order/orderPagination.dto';
import { VisaService } from './payment-menthod/visa/visa.service';
import { ConfigService } from '@nestjs/config';
import { checkUserRole } from 'src/common/role/user';


@ApiBearerAuth()
@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly momoService: MomoService,
    private readonly payPalService: PayPalService,
    private readonly visaService: VisaService,
    private readonly vnpayService: VnpayService,
    private readonly zalopayService: ZalopayService,
    private readonly configService: ConfigService,
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
    try {
      const result = await this.momoService.handleReturn(query);
      return res.redirect(result);
    } catch (error) {
      const failureUrl = this.configService.get<string>('redirectUrls.failureUrl') || 'http://localhost:3000/payment/failed';
      return res.redirect(failureUrl);
    }
  }
  @ApiExcludeEndpoint()
  @Get('paypal/success/return')
  async handlePaypalSuccess(
    @Query('token') orderId: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.payPalService.handleReturnSuccessPaypal(orderId);
      if (!result) {
        throw new BadRequestException('Invalid order ID or token');
      }
      return res.redirect(result);
    } catch (error) {
      const failureUrl = this.configService.get<string>('redirectUrls.failureUrl') || 'http://localhost:3000/payment/failed';
      return res.redirect(failureUrl);
    }
  }
  @ApiExcludeEndpoint()
  @Get('paypal/cancel/return')
  async handlePaypalCancel(@Query('token') orderId: string, @Res() res: Response) {
    try {
      const result = await this.payPalService.handleReturnCancelPaypal(orderId);
      return res.redirect(result);
    } catch (error) {
      const failureUrl = this.configService.get<string>('redirectUrls.failureUrl') || 'http://localhost:3000/payment/failed';
      return res.redirect(failureUrl);
    }
  }




  // Visa (Stripe)
  @ApiExcludeEndpoint()
  @Get('visa/success/return')
  async handleVisaSuccess(@Query('session_id') sessionId: string, @Res() res: Response) {
    try {
      if (!sessionId) {
        throw new BadRequestException('Missing session_id parameter');
      }
      const result = await this.visaService.handleReturnSuccessVisa(sessionId);
      if (!result) {
        throw new BadRequestException('Invalid session ID');
      }
      return res.redirect(result);
    } catch (error) {
      const failureUrl = this.configService.get<string>('redirectUrls.failureUrl') || 'http://localhost:3000/payment/failed';
      return res.redirect(failureUrl);
    }
  }
  @ApiExcludeEndpoint()
  @Get('visa/cancel/return')
  async handleVisaCancel(@Query('session_id') sessionId: string, @Res() res: Response) {
    try {
      if (!sessionId) {
        throw new BadRequestException('Missing session_id parameter');
      }
      const result = await this.visaService.handleReturnCancelVisa(sessionId);
      return res.redirect(result);
    } catch (error) {
      const failureUrl = this.configService.get<string>('redirectUrls.failureUrl') || 'http://localhost:3000/payment/failed';
      return res.redirect(failureUrl);
    }
  }


  // VnPay
  @ApiExcludeEndpoint()
  @Get('vnpay/return')
  async handleVnPayReturn(@Query() query: any, @Res() res: Response) {
    try {
      const result = await this.vnpayService.handleReturnVnPay(query);
      return res.redirect(result);
    } catch (error) {
      const failureUrl = this.configService.get<string>('redirectUrls.failureUrl') || 'http://localhost:3000/payment/failed';
      return res.redirect(failureUrl);
    }
  }


  // ZaloPay
  @ApiExcludeEndpoint()
  @Get('zalopay/return')
  async handleZaloPayReturn(@Query() query: any, @Res() res: Response) {
    try {
      const result = await this.zalopayService.handleReturnZaloPay(query);
      return res.redirect(result);
    } catch (error) {
      const failureUrl = this.configService.get<string>('redirectUrls.failureUrl') || 'http://localhost:3000/payment/failed';
      return res.redirect(failureUrl);
    }
  }



  // View All Orders
  @UseGuards(JwtAuthGuard)
  @Get('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'View all orders for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['all', ...Object.values(StatusOrder)], example: 'all', description: 'Trạng thái đơn hàng', })
  @ApiQuery({ name: 'search', required: false, type: String, example: '' })
  @ApiQuery({ name: 'userId', required: false, type: String, example: 'uuid' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2025-07-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2025-07-03' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'order.order_date | user.username | movie.name',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @ApiQuery({ name: 'paymentMethod', required: false, type: String, example: 'momo' })
  @ApiResponse({ status: 200, description: 'List of all orders' })
  async getAllOrders(
    @Req() req,
    @Query() query: OrderPaginationDto,
  ) {
    const user = req.user;
    checkAdminEmployeeRole(user, 'You do not have permission to view all orders');

    const {
      page = 1,
      take = 10,
      status,
      ...restFilters
    } = query;

    const statusValue: StatusOrder | undefined =
      status === 'all' ? undefined : (status as StatusOrder);

    return this.orderService.getAllOrders({
      page,
      take: Math.min(take, 100),
      status: statusValue,
      ...restFilters,
    });
  }



    @UseGuards(JwtAuthGuard)
  @Get('getOrdersByUserId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'View my orders' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['all', ...Object.values(StatusOrder)], example: 'all', default: 'all' })
  @ApiQuery({ name: 'search', required: false, type: String, example: '' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2025-07-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2025-07-03' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'order_date|movie_name|room_name' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], example: 'ASC' })
  @ApiQuery({ name: 'paymentMethod', required: false, type: String, example: 'momo' })
  async getMyOrders(
    @Req() req,
    @Query() query: OrderPaginationDto,
  ) {
    const user = req.user as JWTUserType;
    const { page = 1, take = 10, status, ...restFilters } = query;
    const takeLimit = Math.min(take, 100);
    const statusValue = status === 'all' ? undefined : (status as StatusOrder);
    return this.orderService.getMyOrders({
      page,
      take: takeLimit,
      status: statusValue,
      ...restFilters,
      userId: user.account_id,
    });
  }
  // Get Order by Id 
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'View Order by ID ' })
  async getMyOrder(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.orderService.getOrderByIdEmployeeAndAdmin(id);
  }
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get order by Order ID' })
  @ApiBody({ type: ScanQrCodeDto })
  @ApiBearerAuth()
  @Post('scan-qr')
  scanQrCode(@Body() data: ScanQrCodeDto, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can scan QR code.');
    return this.orderService.scanQrCode(data.qrCode);
  }





}
