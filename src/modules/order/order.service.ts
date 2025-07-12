
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from 'src/database/entities/order/order';
import { OrderDetail } from 'src/database/entities/order/order-detail';
import { PaymentMethod } from 'src/database/entities/order/payment-method';
import { Transaction } from 'src/database/entities/order/transaction';
import { HoldSeatType, JWTUserType, OrderBillType, SeatInfo } from 'src/common/utils/type';
import { User } from 'src/database/entities/user/user';
import { Promotion } from 'src/database/entities/promotion/promotion';
import { Schedule } from 'src/database/entities/cinema/schedule';
import { Ticket } from 'src/database/entities/order/ticket';
import { TicketType } from 'src/database/entities/order/ticket-type';
import { PayPalService } from './payment-menthod/paypal/paypal.service';
import { Method } from 'src/common/enums/payment-menthod.enum';
import { VisaService } from './payment-menthod/visa/visa.service';
import { VnpayService } from './payment-menthod/vnpay/vnpay.service';
import { MomoService } from './payment-menthod/momo/momo.service';
import { ZalopayService } from './payment-menthod/zalopay/zalopay.service';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { StatusSeat } from 'src/common/enums/status_seat.enum';
import Redis from 'ioredis';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { MyGateWay } from 'src/common/gateways/seat.gateway';
import { OrderExtra } from 'src/database/entities/order/order-extra';
import { Product } from 'src/database/entities/item/product';
import { applyAudienceDiscount, calculateProductTotal, roundUpToNearest } from 'src/common/utils/helper';
import { ProductTypeEnum } from 'src/common/enums/product.enum';
import { Combo } from 'src/database/entities/item/combo';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ConflictException } from 'src/common/exceptions/conflict.exception';
import { ForbiddenException } from 'src/common/exceptions/forbidden.exception';
import { InternalServerErrorException } from 'src/common/exceptions/internal-server-error.exception';
import { ConfigService } from '@nestjs/config';
import { TicketService } from '../ticket/ticket.service';
import { Role } from 'src/common/enums/roles.enum';
import { HistoryScore } from 'src/database/entities/order/history_score';
import { JwtService } from '@nestjs/jwt';
import { OrderPaginationDto } from 'src/common/pagination/dto/order/orderPagination.dto';
import { applyCommonFilters } from 'src/common/pagination/applyCommonFilters';
import { orderFieldMapping } from 'src/common/pagination/fillters/order-field-mapping';
import { applySorting } from 'src/common/pagination/apply_sort';
import { buildPaginationResponse } from 'src/common/pagination/pagination-response';
import { applyPagination } from 'src/common/pagination/applyPagination';
@Injectable()
export class OrderService {


  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderDetail)
    private orderDetailRepository: Repository<OrderDetail>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Promotion)
    private promotionRepository: Repository<Promotion>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketType)
    private ticketTypeRepository: Repository<TicketType>,
    @InjectRepository(ScheduleSeat)
    private scheduleSeatRepository: Repository<ScheduleSeat>,
    @InjectRepository(OrderExtra)
    private orderExtraRepository: Repository<OrderExtra>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(HistoryScore)
    private historyScoreRepository: Repository<HistoryScore>,





    private readonly momoService: MomoService,
    private readonly paypalService: PayPalService,
    private readonly visaService: VisaService,
    private readonly vnpayService: VnpayService,
    private readonly zalopayService: ZalopayService,
    private readonly gateway: MyGateWay,
    private readonly ticketService: TicketService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,




    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,


  ) { }
  async getAllOrderTest() {
    const orders = await this.orderRepository.find({
      relations: ['orderDetails.schedule'],
    });
    return orders
  }
  private async getUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId }
      , relations: ['role']
    }
    );
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }


  private async getPromotionById(promotionId: number) {
    const promotion = await this.promotionRepository.findOne({
      where: { id: promotionId, is_active: true },
      relations: ['promotionType']
    });
    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${promotionId} not found or is not active`);
    }
    return promotion;
  }

  private async getScheduleById(scheduleId: number) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId, is_deleted: false },
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found or is deleted`);
    }
    return schedule;
  }
  private async getOrderById(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['transaction']
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    return order;
  }
  private async getTransactionById(transactionId: number) {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['order', 'paymentMethod'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }
    return transaction;
  }

  private async getTicketTypesByAudienceTypes(audienceTypes: string[]) {
    const ticketTypes = await this.ticketTypeRepository.find({
      where: { audience_type: In(audienceTypes) },
    });

    if (!ticketTypes || ticketTypes.length === 0) {
      throw new NotFoundException(`No ticket types found for audiences: ${audienceTypes.join(', ')}`);
    }

    return ticketTypes;
  }
  async getOrderExtraByIds(productIds: number[]) {
    const orderExtras = await this.productRepository.find({
      where: { id: In(productIds) },

    });
    if (!orderExtras || orderExtras.length === 0) {
      throw new NotFoundException(`No products found for IDs: ${productIds.join(', ')}`);
    }
    return orderExtras;
  }
  private async getScheduleSeatsByIds(seatIds: string[], scheduleId: number) {
    const scheduleSeats = await this.scheduleSeatRepository.find({
      where: {
        seat: { id: In(seatIds) },
        schedule: { id: scheduleId },
      },
      relations: ['seat', 'seat.seatType'],
    });
    if (!scheduleSeats || scheduleSeats.length === 0) {
      throw new NotFoundException(`No schedule seats found for IDs: ${seatIds.join(', ')} in schedule ${scheduleId}`);
    }
    return scheduleSeats;
  }

  private async changeStatusScheduleSeatToBooked(seatIds: string[], scheduleId: number): Promise<void> {
    if (!seatIds || seatIds.length === 0) {
      throw new NotFoundException('Seat IDs are required');
    }

    const foundSeats = await this.scheduleSeatRepository.find({
      where: {
        schedule: { id: scheduleId },
        seat: { id: In(seatIds) },
      },
      relations: ['seat', 'schedule'],
    });

    if (!foundSeats || foundSeats.length === 0) {
      throw new NotFoundException('Seats not found for the given schedule');
    }

    for (const seat of foundSeats) {
      seat.status = StatusSeat.BOOKED;
      await this.scheduleSeatRepository.save(seat);
    }
  }

  async createOrder(userData: JWTUserType, orderBill: OrderBillType, clientIp: string) {
    try {
      const user = await this.getUserById(userData.account_id);
      // check products
      const products = orderBill.products || [];
      let orderExtras: Product[] = [];
      if (products.length > 0) {
        const productIds = products.map(item => item.product_id);
        orderExtras = await this.getOrderExtraByIds(productIds);
      }

      const [promotion, schedule] = await Promise.all([
        this.getPromotionById(orderBill.promotion_id),
        this.getScheduleById(orderBill.schedule_id),
      ]);



      // check promtion time
      if (promotion.id !== 1) {
        const currentTime = new Date();
        if (
          !promotion.start_time ||
          !promotion.end_time ||
          promotion.start_time > currentTime ||
          promotion.end_time < currentTime
        ) {
          throw new BadRequestException('Promotion is not valid at this time.');
        }
        // check score 
        if (promotion.exchange > user.score) {
          throw new ConflictException('You do not have enough score to use this promotion.');
        }
        //check trường hợp nhân viên đặt hàng nhưng lại dùng giảm giá mà k gán customer
        if (user.role.role_id === Role.EMPLOYEE || user.role.role_id === Role.ADMIN && !orderBill.customer_id) {
          throw new ConflictException('Staff must provide customer ID when using promotion.');
        }
      }


      // Fetch seat IDs
      const seatIds = orderBill.seats.map((seat: SeatInfo) => seat.id);
      const scheduleId = orderBill.schedule_id.toString();

      // check redis
      const check = await this.validateBeforeOrder(scheduleId, user.id, seatIds);
      if (!check) {
        throw new ConflictException('Seats are being held by another user. Please try again later.');
      }

      const scheduleSeats = await this.getScheduleSeatsByIds(seatIds, orderBill.schedule_id);

      // Kiểm tra unavailable seats
      const unavailableSeats = scheduleSeats.filter(
        seat => seat.status === StatusSeat.BOOKED || seat.status === StatusSeat.HELD,
      );
      if (unavailableSeats.length > 0) {
        throw new BadRequestException(
          `Seats ${unavailableSeats.map(s => s.seat.id).join(', ')} are already booked or held.`,
        );
      }
      // tinh toan tổng tiền
      let totalSeats = 0;
      let totalProduct = 0;
      let totalPrice = 0;

      const promotionDiscount = parseFloat(promotion?.discount ?? '0');
      const isPercentage = promotion?.promotionType?.type === 'percentage';




      // 1. Tính giá từng vé sau audience-discount
      const audienceTypes = orderBill.seats.map(seat => seat.audience_type);
      const ticketForAudienceTypes = await this.getTicketTypesByAudienceTypes(audienceTypes);

      const seatPriceMap = new Map<string, number>(); // Map seatId -> final seat price

      for (const seatData of orderBill.seats) {
        const seat = scheduleSeats.find(s => s.seat.id === seatData.id);
        if (!seat) throw new NotFoundException(`Seat ${seatData.id} not found`);

        const ticketType = ticketForAudienceTypes.find(t => t.audience_type === seatData.audience_type);
        const discount = parseFloat(ticketType?.discount ?? '0');

        const basePrice = seat.seat.seatType.seat_type_price;
        const finalPrice = applyAudienceDiscount(basePrice, discount);

        seatPriceMap.set(seatData.id, finalPrice);
        totalSeats += finalPrice;
      }
      if (orderExtras.length > 0) {
        totalProduct = calculateProductTotal(orderExtras, orderBill);
      }
      const totalBeforePromotion = totalSeats + totalProduct;// before promotion
      const promotionAmount = isPercentage
        ? Math.round(totalBeforePromotion * (promotionDiscount / 100))
        : Math.round(promotionDiscount);

      totalPrice = totalBeforePromotion - promotionAmount;

      // console.log({ totalBeforePromotion, promotionAmount, totalPrice });

      // 5. So sánh với client gửi
      const inputTotal = parseFloat(orderBill.total_prices);
      if (Math.abs(totalPrice - inputTotal) > 0.01) {
        throw new BadRequestException('Total price mismatch. Please refresh and try again.');
      }

      const seatRatio = totalSeats / totalBeforePromotion;
      const seatDiscount = Math.round(promotionAmount * seatRatio);
      const productDiscount = promotionAmount - seatDiscount;
      // Tạo transaction
      const paymentMethod = await this.paymentMethodRepository.findOne({
        where: { id: Number(orderBill.payment_method_id) },
      });
      if (!paymentMethod) {
        throw new NotFoundException(`Payment method ${orderBill.payment_method_id} not found`);
      }


      let paymentCode: any;
      // get payment code
      paymentCode = await this.getPaymentCode(orderBill, clientIp);
      if (!paymentCode || !paymentCode.payUrl || !paymentCode.orderId) {
        throw new BadRequestException('Payment method failed to create order');
      }
      // check customer_email

      // Create order

      const newOrder = await this.orderRepository.save({
        total_prices: orderBill.total_prices,
        status: Number(orderBill.payment_method_id) === Method.CASH ? StatusOrder.SUCCESS : StatusOrder.PENDING,
        user,
        promotion,
        customer_id: orderBill.customer_id ?? undefined
      });

      const transaction = await this.transactionRepository.save({
        transaction_code: paymentCode.orderId,
        transaction_date: new Date(), // Save as UTC in database
        prices: orderBill.total_prices,
        status: Number(orderBill.payment_method_id) === Method.CASH ? StatusOrder.SUCCESS : StatusOrder.PENDING,
        paymentMethod,
      });

      // Update order with transaction
      const newOrderWithTransaction = await this.getOrderById(newOrder.id);
      newOrderWithTransaction.transaction = transaction;
      await this.orderRepository.save(newOrderWithTransaction);

      // Update transaction with order
      const updatedTransaction = await this.getTransactionById(transaction.id);
      updatedTransaction.order = newOrderWithTransaction;
      await this.transactionRepository.save(updatedTransaction);



      // Create tickets and order details
      const ticketsToSave: Ticket[] = [];
      const updatedSeats: ScheduleSeat[] = [];
      const orderDetails: {
        total_each_ticket: string;
        order: any;
        ticket: any;
        schedule: any;
      }[] = [];



      // const discountPerSeat = seatDiscount / orderBill.seats.length;

      for (const seatData of orderBill.seats) {
        const seat = scheduleSeats.find(s => s.seat.id === seatData.id);
        const ticketType = ticketForAudienceTypes.find(t => t.audience_type === seatData.audience_type);
        const priceBeforePromo = seatPriceMap.get(seatData.id)!;


        const shareRatio = priceBeforePromo / totalSeats;
        const promotionDiscountForThisSeat = seatDiscount * shareRatio;
        const finalPrice = Math.round(priceBeforePromo - promotionDiscountForThisSeat);

        if (!seat) {
          throw new NotFoundException(`Seat ${seatData.id} not found in scheduleSeats`);
        }

        // Set seat status to HELD when creating order (regardless of payment method)
        seat.status = StatusSeat.HELD;
        updatedSeats.push(seat);

        const newTicket = this.ticketRepository.create({
          seat: seat.seat,
          schedule,
          ticketType,
          status: Number(orderBill.payment_method_id) === Method.CASH,
        });

        ticketsToSave.push(newTicket);

        orderDetails.push({
          total_each_ticket: roundUpToNearest(finalPrice, 1000).toString(),
          order: newOrder,
          ticket: newTicket,
          schedule,
        });
      }


      const savedTickets = await this.ticketRepository.save(ticketsToSave);
      orderDetails.forEach((detail, index) => {
        detail.ticket = savedTickets[index];
      });

      await this.scheduleSeatRepository.save(updatedSeats);
      await this.orderDetailRepository.save(orderDetails);

      // Create order extras
      if (orderExtras.length > 0) {
        const productTotals = orderExtras.map(p => {
          const quantity = orderBill.products?.find(item => item.product_id === p.id)?.quantity || 0;
          return {
            product: p,
            quantity,
            total: Number(p.price) * quantity,
          };
        });

        const totalProductBeforePromo = productTotals.reduce((sum, item) => sum + item.total, 0);
        const orderExtrasToSave: Omit<OrderExtra, 'id'>[] = [];

        for (const item of productTotals) {
          const shareRatio = item.total / totalProductBeforePromo || 0;
          const isCombo = item.product.type.toLocaleLowerCase() === ProductTypeEnum.COMBO


          const basePrice = Number(item.product.price);
          let unit_price_after_discount = basePrice;

          if (isPercentage) {
            const unitDiscount = basePrice * (productDiscount / totalProductBeforePromo);
            unit_price_after_discount = Math.round(basePrice - unitDiscount);
          } else {
            const productDiscountShare = productDiscount * shareRatio;
            const unitDiscount = productDiscountShare / item.quantity;
            unit_price_after_discount = Math.round(basePrice - unitDiscount);
          }


          if (isCombo) {
            const comboProduct = item.product as Combo;
            if (comboProduct.discount != null && !isNaN(comboProduct.discount)) {
              unit_price_after_discount *= (1 - comboProduct.discount / 100);
            }
          }

          orderExtrasToSave.push({
            quantity: item.quantity,
            unit_price: roundUpToNearest(unit_price_after_discount, 1000).toString(),
            order: newOrder,
            product: item.product,
            status:
              Number(orderBill.payment_method_id) === Method.CASH
                ? StatusOrder.SUCCESS
                : StatusOrder.PENDING,
          });
        }

        await this.orderExtraRepository.save(orderExtrasToSave);

      }

      // If payment method is CASH, immediately change seat status to BOOKED
      if (Number(orderBill.payment_method_id) === Method.CASH) {
        const seatIds = orderBill.seats.map(seat => seat.id);
        await this.changeStatusScheduleSeatToBooked(seatIds, orderBill.schedule_id);
      }


      // add score for user , employee order
      if (
        orderBill.customer_id &&
        orderBill.customer_id.trim() !== '' &&
        Number(orderBill.payment_method_id) === Method.CASH
      ) {
        const customer = await this.userRepository.findOne({
          where: { id: orderBill.customer_id },
          relations: ['role'],
        });

        if (!customer || customer.role.role_id !== Role.USER) {
          throw new ForbiddenException('Invalid customer for point accumulation');
        }

        const promotionExchange = promotion?.exchange ?? 0;
        const orderScore = Math.floor(totalPrice / 1000);
        const addScore = orderScore - promotionExchange;

        customer.score += addScore;
        await this.userRepository.save(customer);

        await this.historyScoreRepository.save({
          score_change: addScore,
          user: customer,
          order: newOrder,
        });

      }
      // socket emit
      (Number(orderBill.payment_method_id) === Method.CASH
        ? this.gateway.emitBookSeat
        : this.gateway.emitHoldSeat
      )({
        schedule_id: orderBill.schedule_id,
        seatIds: orderBill.seats.map(seat => seat.id),
      });

      return { payUrl: paymentCode.payUrl };
    } catch (error) {
      throw error;
    }
  }

  private async validateBeforeOrder(
    scheduleId: string,
    userId: string,
    requestSeatIds: string[],
  ): Promise<boolean> {

    const redisKey = `seat-hold-${scheduleId}-${userId}`;
    const data = await this.redisClient.get(redisKey);

    if (!data) {
      // socket seat return not yet
      this.gateway.server.to(`schedule-${scheduleId}`).emit('seat_cancel_hold_update', {
        seatIds: requestSeatIds,
        schedule_id: scheduleId,
        status: StatusSeat.NOT_YET,
      });
      throw new BadRequestException('Your seat hold has expired. Please select seats again.');
    }

    const keys = await this.redisClient.keys(`seat-hold-${scheduleId}-*`);

    if (!keys.length) return true;

    const redisData = await Promise.all(keys.map((key) => this.redisClient.get(key)));

    for (let i = 0; i < redisData.length; i++) {
      const key = keys[i];
      const data = redisData[i];
      if (!data) continue;


      const prefix = `seat-hold-${scheduleId}-`;
      const redisUserId = key.slice(prefix.length);
      // Bỏ qua nếu key này là của chính user đang đặt
      if (redisUserId === userId) continue;

      let parsed: HoldSeatType;
      try {
        parsed = JSON.parse(data);
      } catch (e) {
        continue;
      }

      // Check trùng ghế
      const isSeatHeld = requestSeatIds.some((seatId) => parsed.seatIds.includes(seatId));
      if (isSeatHeld) {
        return false;
      }
    }

    // Xóa Redis key của người dùng hiện tại sau khi đặt đơn thành công
    await this.redisClient.del(redisKey);
    return true;
  }


  private async getPaymentCode(
    orderBill: OrderBillType,
    clientIp: string,

  ) {
    switch (Number(orderBill.payment_method_id)) {
      case Method.MOMO:
        return this.momoService.createOrderMomo(orderBill.total_prices);
      case Method.PAYPAL:
        return this.paypalService.createOrderPaypal(orderBill);
      case Method.VISA:
        return this.visaService.createOrderVisa(orderBill);
      case Method.VNPAY:
        return this.vnpayService.createOrderVnPay(orderBill.total_prices, clientIp);
      case Method.ZALOPAY:
        return this.zalopayService.createOrderZaloPay(orderBill);
      default:
        return {
          payUrl: 'Payment successful by Cash',
          orderId: 'CASH_ORDER_' + new Date().getTime(),
        };
    }
  }

  async getOrderOverview() {
    const [statusCounts, revenueResult] = await Promise.all([
      this.orderRepository
        .createQueryBuilder('order')
        .select('order.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('order.status')
        .getRawMany(),

      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.total_prices)', 'revenue')
        .where('order.status = :status', { status: StatusOrder.SUCCESS })
        .getRawOne<{ revenue: string }>(),
    ]);

    const countByStatus = Object.fromEntries(
      statusCounts.map((row) => [row.status, Number(row.count)]),
    );

    const totalSuccess = countByStatus[StatusOrder.SUCCESS] || 0;
    const totalFailed = countByStatus[StatusOrder.FAILED] || 0;
    const totalPending = countByStatus[StatusOrder.PENDING] || 0;

    const totalOrders = totalSuccess + totalFailed + totalPending;
    return {
      totalOrders,
      totalSuccess,
      totalFailed,
      totalPending,
      revenue: revenueResult?.revenue,
    };
  }

  // 📊 Advanced Analytics Methods
  async getRevenueAnalytics(startDate?: string, endDate?: string) {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.transaction', 'transaction')
      .leftJoinAndSelect('transaction.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('order.orderDetails', 'orderDetail')
      .leftJoinAndSelect('orderDetail.schedule', 'schedule')
      .leftJoinAndSelect('schedule.movie', 'movie')
      .where('order.status = :status', { status: StatusOrder.SUCCESS });

    if (startDate) {
      qb.andWhere('order.order_date >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('order.order_date <= :endDate', { endDate });
    }

    const orders = await qb.getMany();

    // Revenue by payment method
    const revenueByPaymentMethod = orders.reduce((acc, order) => {
      const method = order.transaction.paymentMethod.name;
      acc[method] = (acc[method] || 0) + Number(order.total_prices);
      return acc;
    }, {} as Record<string, number>);

    // Revenue by movie
    const revenueByMovie = orders.reduce((acc, order) => {
      const movieName = order.orderDetails[0]?.schedule?.movie?.name || 'Unknown';
      acc[movieName] = (acc[movieName] || 0) + Number(order.total_prices);
      return acc;
    }, {} as Record<string, number>);

    // Daily revenue
    const dailyRevenue = orders.reduce((acc, order) => {
      const date = order.order_date.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + Number(order.total_prices);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue: orders.reduce((sum, order) => sum + Number(order.total_prices), 0),
      totalOrders: orders.length,
      averageOrderValue: orders.length > 0 ?
        orders.reduce((sum, order) => sum + Number(order.total_prices), 0) / orders.length : 0,
      revenueByPaymentMethod,
      revenueByMovie,
      dailyRevenue,
    };
  }

  async getPopularMoviesReport(limit: number = 10) {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderDetails', 'orderDetail')
      .leftJoinAndSelect('orderDetail.schedule', 'schedule')
      .leftJoinAndSelect('schedule.movie', 'movie')
      .select('movie.id', 'movieId')
      .addSelect('movie.name', 'movieName')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .addSelect('SUM(order.total_prices)', 'totalRevenue')
      .addSelect('COUNT(orderDetail.id)', 'totalTickets')
      .where('order.status = :status', { status: StatusOrder.SUCCESS })
      .groupBy('movie.id, movie.name')
      .orderBy('totalRevenue', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map(row => ({
      movieId: row.movieId,
      movieName: row.movieName,
      totalOrders: Number(row.totalOrders),
      totalRevenue: Number(row.totalRevenue),
      totalTickets: Number(row.totalTickets),
      averageTicketPrice: Number(row.totalRevenue) / Number(row.totalTickets),
    }));
  }

  async getUserPurchaseHistory(userId: string, limit: number = 20) {
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderDetails', 'orderDetail')
      .leftJoinAndSelect('orderDetail.schedule', 'schedule')
      .leftJoinAndSelect('schedule.movie', 'movie')
      .leftJoinAndSelect('order.transaction', 'transaction')
      .leftJoinAndSelect('transaction.paymentMethod', 'paymentMethod')
      .where('order.user.id = :userId', { userId })
      .andWhere('order.status = :status', { status: StatusOrder.SUCCESS })
      .orderBy('order.order_date', 'DESC')
      .limit(limit)
      .getMany();

    return {
      totalSpent: orders.reduce((sum, order) => sum + Number(order.total_prices), 0),
      totalOrders: orders.length,
      favoritePaymentMethod: this.getMostFrequent(
        orders.map(o => o.transaction.paymentMethod.name)
      ),
      recentOrders: orders.map(order => ({
        id: order.id,
        movieName: order.orderDetails[0]?.schedule?.movie?.name,
        orderDate: order.order_date,
        totalPrice: order.total_prices,
        paymentMethod: order.transaction.paymentMethod.name,
      })),
    };
  }

  private getMostFrequent(arr: string[]): string {
    const frequency = arr.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
  }

  async getAllOrders(filters: OrderPaginationDto) {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.promotion', 'promotion')
      .leftJoinAndSelect('order.transaction', 'transaction')
      .leftJoinAndSelect('transaction.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('order.orderDetails', 'orderDetail')
      .leftJoinAndSelect('orderDetail.ticket', 'ticket')
      .leftJoinAndSelect('ticket.seat', 'seat')
      .leftJoinAndSelect('ticket.ticketType', 'ticketType')
      .leftJoinAndSelect('orderDetail.schedule', 'schedule')
      .leftJoinAndSelect('schedule.movie', 'movie')
      .leftJoinAndSelect('schedule.cinemaRoom', 'cinemaRoom')
      .leftJoinAndSelect('order.orderExtras', 'orderExtra')
      .leftJoinAndSelect('orderExtra.product', 'product');

    //  Apply filters
    applyCommonFilters(qb, filters, orderFieldMapping);

    //  Apply sorting
    const allowedSortFields = [
      'order.id',
      'order.order_date',
      'user.username',
      'movie.name',
      'paymentMethod.name',
      'order.status',
      'order.total_prices',
    ];
    applySorting(
      qb,
      filters.sortBy,
      filters.sortOrder,
      allowedSortFields,
      'order.order_date',
    );

    //  Pagination
    applyPagination(qb, {
      page: filters.page,
      take: filters.take,
    });

    const [orders, total] = await qb.getManyAndCount();

    //  Map to summary DTO
    const summaries = orders.map((order) =>
      this.mapToBookingSummaryLite(order),
    );
    //  Calculate additional metrics
    const [statusCounts, revenueResult] = await Promise.all([
      this.orderRepository
        .createQueryBuilder('order')
        .select('order.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('order.status')
        .getRawMany(),

      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.total_prices)', 'revenue')
        .where('order.status = :status', { status: StatusOrder.SUCCESS })
        .getRawOne<{ revenue: string }>(),
    ]);

    const countByStatus = Object.fromEntries(
      statusCounts.map((row) => [row.status, Number(row.count)]),
    );

    const totalSuccess = countByStatus[StatusOrder.SUCCESS] || 0;
    const totalFailed = countByStatus[StatusOrder.FAILED] || 0;
    const totalPending = countByStatus[StatusOrder.PENDING] || 0;


    return buildPaginationResponse(summaries, {
      total,
      page: filters.page,
      take: filters.take,
      totalSuccess,
      totalFailed,
      totalPending,
      revenue: revenueResult?.revenue,
    });
  }


  async getOrderByIdEmployeeAndAdmin(orderId: number) {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.promotion', 'promotion')
      .leftJoinAndSelect('order.transaction', 'transaction')
      .leftJoinAndSelect('transaction.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('order.orderDetails', 'orderDetail')
      .leftJoinAndSelect('orderDetail.ticket', 'ticket')
      .leftJoinAndSelect('ticket.seat', 'seat')
      .leftJoinAndSelect('ticket.ticketType', 'ticketType')
      .leftJoinAndSelect('orderDetail.schedule', 'schedule')
      .leftJoinAndSelect('schedule.movie', 'movie')
      .leftJoinAndSelect('schedule.cinemaRoom', 'cinemaRoom')
      .leftJoinAndSelect('order.orderExtras', 'orderExtra')
      .leftJoinAndSelect('orderExtra.product', 'product')
      .where('order.id = :orderId', { orderId });

    const order = await qb.getOne();

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return this.mapToBookingSummaryLite(order);
  }

  async getMyOrders(filters: OrderPaginationDto & { userId: string }) {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.promotion', 'promotion')
      .leftJoinAndSelect('order.transaction', 'transaction')
      .leftJoinAndSelect('transaction.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('order.orderDetails', 'orderDetail')
      .leftJoinAndSelect('orderDetail.ticket', 'ticket')
      .leftJoinAndSelect('ticket.seat', 'seat')
      .leftJoinAndSelect('ticket.ticketType', 'ticketType')
      .leftJoinAndSelect('orderDetail.schedule', 'schedule')
      .leftJoinAndSelect('schedule.movie', 'movie')
      .leftJoinAndSelect('schedule.cinemaRoom', 'cinemaRoom')
      .leftJoinAndSelect('order.orderExtras', 'orderExtra')
      .leftJoinAndSelect('orderExtra.product', 'product')
      .where('user.id = :userId', { userId: filters.userId });


    applyCommonFilters(qb, filters, orderFieldMapping);

    const allowedSortFields = [
      'order.id',
      'order.order_date',
      'movie.name',
      'user.username',
      'paymentMethod.name',
      'order.status',
      'order.total_prices',
    ];
    applySorting(
      qb,
      filters.sortBy,
      filters.sortOrder,
      allowedSortFields,
      'order.order_date',
    );


    applyPagination(qb, {
      page: filters.page,
      take: filters.take,
    });

    const [orders, total] = await qb.getManyAndCount();

    const summaries = orders.map((order) => this.mapToBookingSummaryLite(order),);


    const [statusCounts, revenueResult] = await Promise.all([
      this.orderRepository
        .createQueryBuilder('order')
        .select('order.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('order.user.id = :userId', { userId: filters.userId })
        .groupBy('order.status')
        .getRawMany(),

      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.total_prices)', 'revenue')
        .where('order.status = :status', { status: StatusOrder.SUCCESS })
        .andWhere('order.user.id = :userId', { userId: filters.userId })
        .getRawOne<{ revenue: string }>(),
    ]);

    const countByStatus = Object.fromEntries(
      statusCounts.map((row) => [row.status, Number(row.count)]),
    );

    const totalSuccess = countByStatus[StatusOrder.SUCCESS] || 0;
    const totalFailed = countByStatus[StatusOrder.FAILED] || 0;
    const totalPending = countByStatus[StatusOrder.PENDING] || 0;

    return buildPaginationResponse(summaries, {
      total,
      page: filters.page,
      take: filters.take,
      totalSuccess,
      totalFailed,
      totalPending,
      revenue: revenueResult?.revenue,
    });
  }

  private mapToBookingSummaryLite(order: Order) {
    return {
      id: order.id,
      order_date: order.order_date,
      total_prices: order.total_prices,
      status: order.status,
      qr_code: order.qr_code,
      user: {
        id: order.user.id,
        username: order.user.username,
        email: order.user.email,
      },
      promotion: {
        title: order.promotion?.title,
      },
      cinemaroom: {
        id: order.orderDetails[0].schedule.cinemaRoom.id,
        name: order.orderDetails[0].schedule.cinemaRoom.cinema_room_name,
      },
      schedule: {
        id: order.orderDetails[0].schedule.id,
        start_time: order.orderDetails[0].schedule.start_movie_time,
        end_time: order.orderDetails[0].schedule.end_movie_time,
      },
      movie: {
        id: order.orderDetails[0].schedule.movie.id,
        name: order.orderDetails[0].schedule.movie.name,
      },
      orderDetails: order.orderDetails.map(detail => ({
        id: detail.id,
        total_each_ticket: detail.total_each_ticket,
        ticketId: detail.ticket.id,
        seat: {
          id: detail.ticket.seat.id,
          seat_row: detail.ticket.seat.seat_row,
          seat_column: detail.ticket.seat.seat_column,
        }, ticketType: {
          ticket_name: detail.ticket.ticketType.ticket_name,
        },

      })),
      orderExtras: order.orderExtras?.map(extra => ({
        id: extra.id,
        quantity: extra.quantity,
        unit_price: extra.unit_price,
        status: extra.status,
        product: {
          id: extra.product.id,
          name: extra.product.name,
          type: extra.product.type,
          price: extra.product.price,
        },
      })) ?? [],
      transaction: {
        transaction_code: order.transaction.transaction_code,
        transaction_date: order.transaction.transaction_date,
        status: order.transaction.status,
        PaymentMethod: {
          method_name: order.transaction.paymentMethod.name,
        },
      },
    };
  }

  async scanQrCode(qrCode: string) {
    try {
      const rawDecoded = this.jwtService.verify(qrCode, { secret: this.configService.get<string>('jwt.qrSecret') });
      const decoded = rawDecoded as { orderId: number };
      const order = await this.getOrderByIdEmployeeAndAdmin(decoded.orderId);
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      //  use all ticket in order by qr code
      const ticketIds = order.orderDetails.map(detail => detail.ticketId);
      if (ticketIds.length === 0) {
        throw new NotFoundException('No tickets found for this order');
      }
      await this.ticketService.markTicketsAsUsed(ticketIds);

      return order;
    } catch (error) {
      throw new BadRequestException('Invalid QR code');
    }
  }


  async userProcessOrderPayment(
    orderId: number,
    orderData: OrderBillType,
    userId: string,
    clientIp: string

  ) {

    try {
      // 1. Kiểm tra user và order
      const user = await this.getUserById(userId);
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: [
          'user',
          'transaction',
          'transaction.paymentMethod',
          'orderDetails',
          'orderDetails.ticket',
          'orderDetails.ticket.seat',
          'orderDetails.schedule',
          'orderExtras',
          'orderExtras.product',
          'promotion'
        ]
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      // 2. Kiểm tra quyền sở hữu đơn hàng
      if (order.user.id !== userId && user.role.role_id !== Role.ADMIN && user.role.role_id !== Role.EMPLOYEE) {
        throw new ForbiddenException('You can only process your own orders');
      }

      // 3. Kiểm tra trạng thái đơn hàng
      if (order.status !== StatusOrder.PENDING) {
        throw new BadRequestException('Only pending orders can be processed');
      }

      // 4. Validation: Chỉ cho phép thay đổi payment_method_id, các thông tin khác phải giống với order hiện tại
      const currentScheduleId = order.orderDetails[0]?.schedule?.id;
      const currentPromotionId = order.promotion?.id || 1;
      const currentSeatIds = order.orderDetails.map(d => d.ticket.seat.id).sort();
      const inputSeatIds = orderData.seats.map(s => s.id).sort();

      // Kiểm tra schedule
      if (orderData.schedule_id !== currentScheduleId) {
        throw new BadRequestException('Schedule cannot be changed when re-processing payment');
      }

      // Kiểm tra promotion
      if (orderData.promotion_id !== currentPromotionId) {
        throw new BadRequestException('Promotion cannot be changed when re-processing payment');
      }

      // Kiểm tra seats
      if (JSON.stringify(currentSeatIds) !== JSON.stringify(inputSeatIds)) {
        throw new BadRequestException('Seats cannot be changed when re-processing payment');
      }

      // Kiểm tra products
      const currentProducts = order.orderExtras || [];
      const inputProducts = orderData.products || [];

      if (currentProducts.length !== inputProducts.length) {
        throw new BadRequestException('Products cannot be changed when re-processing payment');
      }

      for (const inputProduct of inputProducts) {
        const currentProduct = currentProducts.find(p => p.product.id === inputProduct.product_id);
        if (!currentProduct || currentProduct.quantity !== inputProduct.quantity) {
          throw new BadRequestException('Products cannot be changed when re-processing payment');
        }
      }
      const price1 = parseFloat(order.total_prices).toFixed(2);
      const price2 = parseFloat(orderData.total_prices).toFixed(2);
      // Kiểm tra total_prices
      if (price1 !== price2) {
        throw new BadRequestException('Total price cannot be changed when re-processing payment');
      }

      // 5. Kiểm tra payment method
      const paymentMethod = await this.paymentMethodRepository.findOne({
        where: { id: Number(orderData.payment_method_id) }
      });

      if (!paymentMethod) {
        throw new NotFoundException(`Payment method with ID ${orderData.payment_method_id} not found`);
      }

      // 6. Tạo payment URL mới
      const paymentCode = await this.getPaymentCode(orderData as OrderBillType, clientIp);

      if (!paymentCode?.payUrl || !paymentCode?.orderId) {
        throw new BadRequestException('Failed to create payment URL');
      }

      // 7. Cập nhật transaction (chỉ được thay đổi payment method, transaction_code và transaction_date)
      order.transaction.transaction_code = paymentCode.orderId;
      order.transaction.transaction_date = new Date();
      order.transaction.paymentMethod = paymentMethod;
      await this.transactionRepository.save(order.transaction);

      // 8. Cập nhật order_date
      order.order_date = new Date();
      await this.orderRepository.save(order);

      return {
        payUrl: paymentCode.payUrl,
      };

    } catch (error) {
      console.error('Error processing order payment:', error);
      throw new BadRequestException('Failed to process order payment');

    }
  }


  async adminUpdateAndProcessOrder(
    orderId: number,
    updateData: OrderBillType,
    clientIp: string,
    adminId: string
  ) {
    try {
      // 1. Kiểm tra admin/employee
      const admin = await this.getUserById(adminId);
      if (admin.role.role_id === Role.USER) {
        throw new ForbiddenException('Only admin or employee can update orders');
      }

      // 2. Lấy order hiện tại
      const existingOrder = await this.orderRepository.createQueryBuilder('order')
        .leftJoinAndSelect('order.user', 'user')
        .leftJoinAndSelect('order.promotion', 'promotion')
        .leftJoinAndSelect('order.transaction', 'transaction')
        .leftJoinAndSelect('transaction.paymentMethod', 'paymentMethod')
        .leftJoinAndSelect('order.orderDetails', 'orderDetail')
        .leftJoinAndSelect('orderDetail.ticket', 'ticket')
        .leftJoinAndSelect('ticket.seat', 'seat')
        .leftJoinAndSelect('ticket.ticketType', 'ticketType')
        .leftJoinAndSelect('orderDetail.schedule', 'schedule')
        .leftJoinAndSelect('schedule.movie', 'movie')
        .leftJoinAndSelect('order.orderExtras', 'orderExtras')
        .where('order.id = :orderId', { orderId })
        .getOne();

      if (!existingOrder) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      // 3. Kiểm tra trạng thái đơn hàng
      if (existingOrder.status !== StatusOrder.PENDING) {
        throw new BadRequestException('Only pending orders can be updated');
      }

      // 4. Validate các thông tin mới và lấy products
      const products = updateData.products || [];
      let orderExtras: Product[] = [];
      if (products.length > 0) {
        const productIds = products.map(item => item.product_id);
        orderExtras = await this.getOrderExtraByIds(productIds);
      }

      const [newSchedule, newPromotion] = await Promise.all([
        this.getScheduleById(updateData.schedule_id),
        updateData.promotion_id ? this.getPromotionById(updateData.promotion_id) : Promise.resolve(undefined)
      ]);

      // 5. Giải phóng ghế cũ
      for (const detail of existingOrder.orderDetails) {
        const oldScheduleSeat = await this.scheduleSeatRepository.findOne({
          where: {
            seat: { id: detail.ticket.seat.id },
            schedule: { id: detail.schedule.id }
          }
        });

        if (oldScheduleSeat && oldScheduleSeat.status === StatusSeat.HELD) {
          oldScheduleSeat.status = StatusSeat.NOT_YET;
          await this.scheduleSeatRepository.save(oldScheduleSeat);
        }
      }



      // 6. Validate và đặt ghế mới
      const newSeatIds = updateData.seats.map(seat => seat.id);
      const newScheduleSeats = await this.getScheduleSeatsByIds(newSeatIds, updateData.schedule_id);
      const check = await this.validateBeforeOrder(updateData.schedule_id.toString(), adminId, newSeatIds);
      if (!check) {
        throw new ConflictException('Seats are being held by another user. Please try again later.');
      }

      const unavailableSeats = newScheduleSeats.filter(
        seat => seat.status === StatusSeat.BOOKED || seat.status === StatusSeat.HELD
      );

      if (unavailableSeats.length > 0) {
        throw new BadRequestException(
          `Seats are already booked: ${unavailableSeats.map(s => `${s.id}`).join(', ')}`
        );
      }
      // check redis


      // 7. Tính toán giá tiền
      let totalSeats = 0;
      let totalProduct = 0;
      let totalPrice = 0;

      const promotionDiscount = parseFloat(newPromotion?.discount ?? '0');
      const isPercentage = newPromotion?.promotionType?.type === 'percentage';

      // Tính giá từng vé sau audience-discount
      const audienceTypes = updateData.seats.map(seat => seat.audience_type);
      const ticketForAudienceTypes = await this.getTicketTypesByAudienceTypes(audienceTypes);

      const seatPriceMap = new Map<string, number>();

      for (const seatData of updateData.seats) {
        const seat = newScheduleSeats.find(s => s.seat.id === seatData.id);
        if (!seat) throw new NotFoundException(`Seat ${seatData.id} not found`);

        const ticketType = ticketForAudienceTypes.find(t => t.audience_type === seatData.audience_type);
        const discount = parseFloat(ticketType?.discount ?? '0');

        const basePrice = seat.seat.seatType.seat_type_price;
        const finalPrice = applyAudienceDiscount(basePrice, discount);

        seatPriceMap.set(seatData.id, finalPrice);
        totalSeats += finalPrice;
      }

      if (orderExtras.length > 0) {
        totalProduct = calculateProductTotal(orderExtras, { products: updateData.products } as any);
      }

      const totalBeforePromotion = totalSeats + totalProduct;
      const promotionAmount = isPercentage
        ? Math.round(totalBeforePromotion * (promotionDiscount / 100))
        : Math.round(promotionDiscount);

      totalPrice = totalBeforePromotion - promotionAmount;

      // So sánh với total_prices từ client
      const inputTotal = parseFloat(updateData.total_prices.toString());
      if (Math.abs(totalPrice - inputTotal) > 0.01) {
        throw new BadRequestException('Total price mismatch. Please refresh and try again.');
      }

      const seatRatio = totalSeats / totalBeforePromotion;
      const seatDiscount = Math.round(promotionAmount * seatRatio);
      const productDiscount = promotionAmount - seatDiscount;

      // 8. Xóa dữ liệu cũ (orderDetails, tickets, orderExtras)
      // Lưu lại danh sách tickets để xóa sau
      const ticketsToDelete = existingOrder.orderDetails.map(detail => detail.ticket);

      // Xóa orderDetails trước (vì có foreign key constraint)
      await this.orderDetailRepository.remove(existingOrder.orderDetails);


      // Sau đó xóa tickets
      if (ticketsToDelete.length > 0) {
        await this.ticketRepository.remove(ticketsToDelete);
      }

      // Xóa orderExtras
      if (existingOrder.orderExtras && existingOrder.orderExtras.length > 0) {
        await this.orderExtraRepository.remove(existingOrder.orderExtras);
      }
      // check redis 


      // 9. Đặt ghế mới
      for (const scheduleSeat of newScheduleSeats) {
        scheduleSeat.status = StatusSeat.HELD;
      }
      await this.scheduleSeatRepository.save(newScheduleSeats);

      // 10. Tạo tickets và orderDetails mới
      const ticketsToSave: Ticket[] = [];
      const updatedSeats: ScheduleSeat[] = [];
      const orderDetailsToSave: {
        total_each_ticket: string;
        order: any;
        ticket: any;
        schedule: any;
      }[] = [];

      for (const seatData of updateData.seats) {
        const seat = newScheduleSeats.find(s => s.seat.id === seatData.id);
        const ticketType = ticketForAudienceTypes.find(t => t.audience_type === seatData.audience_type);
        const priceBeforePromo = seatPriceMap.get(seatData.id)!;

        const shareRatio = priceBeforePromo / totalSeats;
        const promotionDiscountForThisSeat = seatDiscount * shareRatio;
        const finalPrice = Math.round(priceBeforePromo - promotionDiscountForThisSeat);
        if (!seat) {
          throw new NotFoundException(`Seat ${seatData.id} not found in scheduleSeats`);
        }
        // Set seat status to HELD when creating order (regardless of payment method)
        seat.status = StatusSeat.HELD;
        updatedSeats.push(seat);

        const newTicket = this.ticketRepository.create({
          seat: seat.seat,
          schedule: newSchedule,
          ticketType,
          status: Number(updateData.payment_method_id) === Method.CASH,
        });

        ticketsToSave.push(newTicket);

        orderDetailsToSave.push({
          total_each_ticket: roundUpToNearest(finalPrice, 1000).toString(),
          order: existingOrder,
          ticket: newTicket,
          schedule: newSchedule,
        });
      }
      const savedTickets = await this.ticketRepository.save(ticketsToSave);
      orderDetailsToSave.forEach((detail, index) => {
        detail.ticket = savedTickets[index];
      });
      await this.scheduleSeatRepository.save(updatedSeats);
      await this.orderDetailRepository.save(orderDetailsToSave);

      // 11. Tạo order extras mới
      if (orderExtras.length > 0) {
        const productTotals = orderExtras.map(p => {
          const quantity = updateData.products?.find(item => item.product_id === p.id)?.quantity || 0;
          return {
            product: p,
            quantity,
            total: Number(p.price) * quantity,
          };
        });

        const totalProductBeforePromo = productTotals.reduce((sum, item) => sum + item.total, 0);
        const orderExtrasToSave: OrderExtra[] = [];

        for (const item of productTotals) {
          if (item.quantity > 0) {
            const shareRatio = item.total / totalProductBeforePromo || 0;
            const isCombo = item.product.type.toLowerCase() === ProductTypeEnum.COMBO;

            const basePrice = Number(item.product.price);
            let unit_price_after_discount = basePrice;

            if (totalProductBeforePromo > 0) {
              if (isPercentage) {
                const unitDiscount = basePrice * (productDiscount / totalProductBeforePromo);
                unit_price_after_discount = Math.round(basePrice - unitDiscount);
              } else {
                const productDiscountShare = productDiscount * shareRatio;
                const unitDiscount = productDiscountShare / item.quantity;
                unit_price_after_discount = Math.round(basePrice - unitDiscount);
              }
            }

            if (isCombo) {
              const comboProduct = item.product as Combo;
              if (comboProduct.discount != null && !isNaN(comboProduct.discount)) {
                unit_price_after_discount *= (1 - comboProduct.discount / 100);
              }
            }

            const orderExtra = this.orderExtraRepository.create({
              quantity: item.quantity,
              unit_price: roundUpToNearest(unit_price_after_discount, 1000).toString(),
              order: existingOrder,
              product: item.product,
              status: Number(updateData.payment_method_id) === Method.CASH
                ? StatusOrder.SUCCESS
                : StatusOrder.PENDING,
            });

            orderExtrasToSave.push(orderExtra);
          }
        }
        await this.orderExtraRepository.save(orderExtrasToSave);

      }

      // 12. Nếu payment method là CASH, đổi trạng thái ghế thành BOOKED
      if (Number(updateData.payment_method_id) === Method.CASH) {
        const seatIds = updateData.seats.map(seat => seat.id);
        await this.changeStatusScheduleSeatToBooked(seatIds, updateData.schedule_id);
      }

      // 13. Cập nhật order (chỉ cập nhật total_prices, promotion, order_date)
      await this.orderRepository.update(
        { id: existingOrder.id },
        {
          total_prices: updateData.total_prices.toString(),
          promotion: newPromotion,
          order_date: new Date(),
        }
      );

      // 14. Tạo payment code
      const paymentCode = await this.getPaymentCode(updateData as OrderBillType, clientIp);

      if (!paymentCode?.payUrl || !paymentCode?.orderId) {
        throw new BadRequestException('Failed to create payment URL');
      }

      // 15. Cập nhật transaction (chỉ cập nhật payment_method_id, transaction_code, transaction_date)
      const paymentMethod = await this.paymentMethodRepository.findOne({
        where: { id: Number(updateData.payment_method_id) }
      });

      if (paymentMethod) {
        existingOrder.transaction.paymentMethod = paymentMethod;
      }

      existingOrder.transaction.transaction_code = paymentCode.orderId;
      existingOrder.transaction.transaction_date = new Date();
      await this.transactionRepository.save(existingOrder.transaction);



      // add score for user , employee order
      if (
        updateData.customer_id &&
        updateData.customer_id.trim() !== '' &&
        Number(updateData.payment_method_id) === Method.CASH
      ) {
        const customer = await this.userRepository.findOne({
          where: { id: updateData.customer_id },
          relations: ['role'],
        });

        if (!customer || customer.role.role_id !== Role.USER) {
          throw new ForbiddenException('Invalid customer for point accumulation');
        }

        const promotionExchange = newPromotion?.exchange ?? 0;
        const orderScore = Math.floor(totalPrice / 1000);
        const addScore = orderScore - promotionExchange;

        customer.score += addScore;
        await this.userRepository.save(customer);

        await this.historyScoreRepository.save({
          score_change: addScore,
          user: customer,
          order: existingOrder,
        });
      }
      // 16 . Emit socket events
      if (Number(updateData.payment_method_id) === Method.CASH) {
        this.gateway.emitBookSeat({
          schedule_id: updateData.schedule_id,
          seatIds: updateData.seats.map(seat => seat.id),
        });

      } else {
        // socket emit thông báo các ghế đã được giải phóng
        this.gateway.emitCancelBookSeat({
          schedule_id: updateData.schedule_id,
          seatIds: existingOrder.orderDetails.map(detail => detail.ticket.seat.id),
        })
        // socket emit thông báo các ghế mới đã đc hold
        this.gateway.emitHoldSeat({
          schedule_id: updateData.schedule_id,
          seatIds: newScheduleSeats.map(seat => seat.seat.id),
        });

      }


      return {
        payUrl: paymentCode.payUrl
      };

    } catch (error) {
      console.log(error);
      throw new BadRequestException('Failed to update and process order');
    }
  }


  async adminCancelOrder(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: [
        'transaction',
        'orderDetails',
        'orderDetails.ticket',
        'orderDetails.ticket.seat',
        'orderDetails.schedule',
        'orderExtras'
      ]
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // check status
    if (order.status !== StatusOrder.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    try {
      // 1. Free up the seats that were booked for this order
      if (order.orderDetails && order.orderDetails.length > 0) {
        const scheduleId = order.orderDetails[0].schedule.id;
        const seatIds = order.orderDetails.map(detail => detail.ticket.seat.id);

        // Update schedule seats status to NOT_YET
        const scheduleSeats = await this.scheduleSeatRepository.find({
          where: {
            seat: { id: In(seatIds) },
            schedule: { id: scheduleId }
          }
        });

        for (const scheduleSeat of scheduleSeats) {
          if (scheduleSeat.status === StatusSeat.HELD) {
            scheduleSeat.status = StatusSeat.NOT_YET;
          }
        }

        await this.scheduleSeatRepository.save(scheduleSeats);

        // Socket notification for seat status change
        this.gateway.emitCancelBookSeat({
          schedule_id: scheduleId,
          seatIds: seatIds
        })
      }

      // 2. Update order status
      order.status = StatusOrder.FAILED;

      // 3. Update transaction status
      if (order.transaction) {
        order.transaction.status = StatusOrder.FAILED;
        await this.transactionRepository.save(order.transaction);
      }

      // 4. Update order extras status
      if (order.orderExtras && order.orderExtras.length > 0) {
        for (const extra of order.orderExtras) {
          extra.status = StatusOrder.FAILED;
        }
        await this.orderExtraRepository.save(order.orderExtras);
      }

      // 5. Update ticket status
      if (order.orderDetails && order.orderDetails.length > 0) {
        const ticketIds = order.orderDetails.map(detail => detail.ticket.id);
        await this.ticketRepository.update(
          { id: In(ticketIds) },
          { status: false }
        );
      }

      // 6. Save the order
      await this.orderRepository.save(order);

      return {
        message: 'Order cancelled successfully',
      };

    } catch (error) {
      console.error('Error cancelling order:', error);
      throw new InternalServerErrorException('Failed to cancel order');
    }
  }
}

