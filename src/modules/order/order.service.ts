import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
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
import { applyAudienceDiscount, calculateProductTotal, formatDate, roundUpToNearest, } from 'src/common/utils/helper';
import { ProductTypeEnum } from 'src/common/enums/product.enum';
import { Combo } from 'src/database/entities/item/combo';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ConflictException } from 'src/common/exceptions/conflict.exception';
import { ForbiddenException } from 'src/common/exceptions/forbidden.exception';
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
import { PaymentGateway } from 'src/common/enums/payment_gatewat.enum';
import { DailyTransactionSummary } from 'src/database/entities/order/daily_transaction_summary';
import { AudienceType } from 'src/common/enums/audience_type.enum';
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
    @InjectRepository(DailyTransactionSummary)
    private dailyTransactionSummaryRepository: Repository<DailyTransactionSummary>,

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
  private async getUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  private async getPromotionById(promotionId: number) {
    const promotion = await this.promotionRepository.findOne({
      where: { id: promotionId, is_active: true },
      relations: ['promotionType'],
    });
    if (!promotion) {
      throw new NotFoundException(
        `Promotion with ID ${promotionId} not found or is not active`,
      );
    }
    return promotion;
  }

  private async getScheduleById(scheduleId: number) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId, is_deleted: false },
    });
    if (!schedule) {
      throw new NotFoundException(
        `Schedule with ID ${scheduleId} not found or is deleted`,
      );
    }
    return schedule;
  }

  private async getOrderById(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['transaction'],
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
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }
    return transaction;
  }

  private async getTicketTypesByAudienceTypes(audienceTypes: string[]) {
    const ticketTypes = await this.ticketTypeRepository.find({
      where: { audience_type: In(audienceTypes) },
    });

    if (!ticketTypes || ticketTypes.length === 0) {
      throw new NotFoundException(
        `No ticket types found for audiences: ${audienceTypes.join(', ')}`,
      );
    }

    return ticketTypes;
  }

  private async getOrderExtraByIds(productIds: number[]) {
    const orderExtras = await this.productRepository.find({
      where: { id: In(productIds) },
    });
    if (!orderExtras || orderExtras.length === 0) {
      throw new NotFoundException(
        `No products found for IDs: ${productIds.join(', ')}`,
      );
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
      throw new NotFoundException(
        `No schedule seats found for IDs: ${seatIds.join(', ')} in schedule ${scheduleId}`,
      );
    }
    return scheduleSeats;
  }

  private async changeStatusScheduleSeatToBooked(
    seatIds: string[],
    scheduleId: number,
  ): Promise<void> {
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

  async createOrder(
    userData: JWTUserType,
    orderBill: OrderBillType,
    clientIp: string,
  ) {
    let user: User | null = null;
    let customer: User | null = null;
    // nếu có customerid thì gọi // 
    if (orderBill.customer_id) {
      const [fetchedUser, fetchedCustomer] = await Promise.all([
        this.getUserById(userData.account_id),
        this.getUserById(orderBill.customer_id),
      ]);
      user = fetchedUser;
      customer = fetchedCustomer;
    }
    else {
      user = await this.getUserById(userData.account_id);
    }
    // check products
    const products = orderBill.products || [];
    let orderExtras: Product[] = [];
    if (products.length > 0) {
      const productIds = products.map((item) => item.product_id);
      orderExtras = await this.getOrderExtraByIds(productIds);
    }

    const [promotion, schedule] = await Promise.all([
      this.getPromotionById(orderBill.promotion_id),
      this.getScheduleById(orderBill.schedule_id),
    ]);

    // check promtion time
    if (promotion.id !== 1) {
      //check trường hợp nhân viên đặt hàng nhưng lại dùng giảm giá mà k gán customer
      if (
        user.role.role_id as Role === Role.EMPLOYEE ||
        (user.role.role_id as Role === Role.ADMIN && !orderBill.customer_id)
      ) {
        throw new ConflictException(
          'Staff must provide customer ID when using promotion.',
        );
      }
      const currentTime = new Date();
      if (
        !promotion.start_time ||
        !promotion.end_time ||
        promotion.start_time > currentTime ||
        promotion.end_time < currentTime
      ) {
        throw new BadRequestException('Promotion is not valid at this time.');
      }
      // check score với tk user , admin thì bỏ qua
      if (
        promotion.exchange > user.score && user.role.role_id as Role === Role.USER) {
        throw new ConflictException(
          'You do not have enough score to use this promotion.',
        );
      }
      if (customer) {
        // Check if customer has enough score
        if (promotion.exchange > customer.score) {
          throw new ConflictException(
            'Customer does not have enough score to use this promotion.',
          );
        }
      }
    }

    // Fetch seat IDs
    const seatIds = orderBill.seats.map((seat: SeatInfo) => seat.id);
    const scheduleId = orderBill.schedule_id;

    // check redis
    const check = await this.validateBeforeOrder(scheduleId, user.id, seatIds);
    if (!check) {
      throw new ConflictException(
        'Seats are being held by another user. Please try again later.',
      );
    }

    const scheduleSeats = await this.getScheduleSeatsByIds(
      seatIds,
      orderBill.schedule_id,
    );

    // Kiểm tra unavailable seats
    const unavailableSeats = scheduleSeats.filter(
      (seat) =>
        seat.status === StatusSeat.BOOKED || seat.status === StatusSeat.HELD,
    );
    if (unavailableSeats.length > 0) {
      throw new BadRequestException(
        `Seats ${unavailableSeats.map((s) => s.seat.id).join(', ')} are already booked or held.`,
      );
    }

    // tinh toan tổng tiền
    let totalSeats = 0;
    let totalProduct = 0;
    let totalPrice = 0;

    const promotionDiscount = parseFloat(promotion?.discount ?? '0');
    const isPercentage = promotion?.promotionType?.type === 'percentage';

    // 1. Tính giá từng vé sau audience-discount
    const audienceTypes = orderBill.seats.map((seat) => seat.audience_type);
    const ticketForAudienceTypes =
      await this.getTicketTypesByAudienceTypes(audienceTypes);

    const seatPriceMap = new Map<string, number>(); // Map seatId -> final seat price

    for (const seatData of orderBill.seats) {
      const seat = scheduleSeats.find((s) => s.seat.id === seatData.id);
      if (!seat) throw new NotFoundException(`Seat ${seatData.id} not found`);

      const ticketType = ticketForAudienceTypes.find(
        (t) => t.audience_type as AudienceType === seatData.audience_type as AudienceType,
      );
      const discount = parseFloat(ticketType?.discount ?? '0');

      const basePrice = seat.seat.seatType.seat_type_price;
      const finalPrice = applyAudienceDiscount(basePrice, discount);

      seatPriceMap.set(seatData.id, finalPrice);
      totalSeats += finalPrice;
    }
    if (orderExtras.length > 0) {
      totalProduct = calculateProductTotal(orderExtras, orderBill);
    }
    const totalBeforePromotion = totalSeats + totalProduct; // before promotion
    const promotionAmount = isPercentage
      ? Math.round(totalBeforePromotion * (promotionDiscount / 100))
      : Math.round(promotionDiscount);

    totalPrice = roundUpToNearest(totalBeforePromotion - promotionAmount, 1000);

    // console.log({ totalBeforePromotion, promotionAmount, totalPrice });

    // 5. So sánh với client gửi
    const inputTotal = parseFloat(orderBill.total_prices);
    if (Math.abs(totalPrice - inputTotal) > 0.01) {
      throw new BadRequestException(
        'Total price mismatch. Please refresh and try again.',
      );
    }

    const seatRatio = totalSeats / totalBeforePromotion;
    const seatDiscount = Math.round(promotionAmount * seatRatio);
    const productDiscount = promotionAmount - seatDiscount;
    // Tạo transaction
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: Number(orderBill.payment_method_id) },
    });
    if (!paymentMethod) {
      throw new NotFoundException(
        `Payment method ${orderBill.payment_method_id} not found`,
      );
    }


    // get payment code
    const paymentCode: { payUrl: string, orderId: string } = await this.getPaymentCode(orderBill, clientIp);
    if (!paymentCode || !paymentCode.payUrl || !paymentCode.orderId) {
      throw new BadRequestException('Payment method failed to create order');
    }


    // Create order

    const newOrder = await this.orderRepository.save({
      total_prices: orderBill.total_prices,
      status:
        Number(orderBill.payment_method_id as Method) === Method.CASH
          ? StatusOrder.SUCCESS
          : StatusOrder.PENDING,
      user,
      promotion,
      customer_id: orderBill.customer_id ?? undefined,
    });

    const transaction = await this.transactionRepository.save({
      transaction_code: paymentCode.orderId,
      transaction_date: new Date(), // Save as UTC in database
      prices: orderBill.total_prices,
      status:
        Number(orderBill.payment_method_id as Method) === Method.CASH
          ? StatusOrder.SUCCESS
          : StatusOrder.PENDING,
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
      order: Order;
      ticket: Ticket;
      schedule: Schedule;
    }[] = [];

    // const discountPerSeat = seatDiscount / orderBill.seats.length;

    for (const seatData of orderBill.seats) {
      const seat = scheduleSeats.find((s) => s.seat.id === seatData.id);
      const ticketType = ticketForAudienceTypes.find(
        (t) => t.audience_type as AudienceType === seatData.audience_type as AudienceType,
      );
      const priceBeforePromo = seatPriceMap.get(seatData.id)!;

      const shareRatio = priceBeforePromo / totalSeats;
      const promotionDiscountForThisSeat = seatDiscount * shareRatio;
      const finalPrice = Math.round(
        priceBeforePromo - promotionDiscountForThisSeat,
      );

      if (!seat) {
        throw new NotFoundException(
          `Seat ${seatData.id} not found in scheduleSeats`,
        );
      }

      // Set seat status to HELD when creating order (regardless of payment method)
      seat.status = StatusSeat.HELD;
      updatedSeats.push(seat);

      const newTicket = this.ticketRepository.create({
        seat: seat.seat,
        schedule,
        ticketType,
        status: Number(orderBill.payment_method_id as Method) === Method.CASH,
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
      const productTotals = orderExtras.map((p) => {
        const quantity =
          orderBill.products?.find((item) => item.product_id === p.id)
            ?.quantity || 0;
        return {
          product: p,
          quantity,
          total: Number(p.price) * quantity,
        };
      });

      const totalProductBeforePromo = productTotals.reduce(
        (sum, item) => sum + item.total,
        0,
      );
      const orderExtrasToSave: OrderExtra[] = [];

      for (const item of productTotals) {
        const shareRatio = item.total / totalProductBeforePromo || 0;
        const isCombo =
          (item.product.type.toLocaleLowerCase() as ProductTypeEnum) === ProductTypeEnum.COMBO;

        const basePrice = Number(item.product.price);
        let unit_price_after_discount = basePrice;

        if (isPercentage) {
          const unitDiscount =
            basePrice * (productDiscount / totalProductBeforePromo);
          unit_price_after_discount = Math.round(basePrice - unitDiscount);
        } else {
          const productDiscountShare = productDiscount * shareRatio;
          const unitDiscount = productDiscountShare / item.quantity;
          unit_price_after_discount = Math.round(basePrice - unitDiscount);
        }

        if (isCombo) {
          const comboProduct = item.product as Combo;
          if (comboProduct.discount != null && !isNaN(comboProduct.discount)) {
            unit_price_after_discount *= 1 - comboProduct.discount / 100;
          }
        }
        const newOrderExtraForeachProduct = this.orderExtraRepository.create({
          quantity: item.quantity,
          unit_price: roundUpToNearest(
            unit_price_after_discount,
            1000,
          ).toString(),
          order: newOrder,
          product: item.product,
          status:
            Number(orderBill.payment_method_id as Method) === Method.CASH
              ? StatusOrder.SUCCESS
              : StatusOrder.PENDING,
        });
        orderExtrasToSave.push(newOrderExtraForeachProduct);
      }
      if (orderExtrasToSave.length > 0) {
        await this.orderExtraRepository.save(orderExtrasToSave);
      }
    }

    // If payment method is CASH, immediately change seat status to BOOKED
    if (Number(orderBill.payment_method_id as Method) === Method.CASH) {
      const seatIds = orderBill.seats.map((seat) => seat.id);
      await this.changeStatusScheduleSeatToBooked(
        seatIds,
        orderBill.schedule_id,
      );
    }

    // add score for user , employee order
    if (customer && Number(orderBill.payment_method_id as Method) === Method.CASH) {
      if (!customer || customer.role.role_id as Role !== Role.USER) {
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
    if (Number(orderBill.payment_method_id as Method) === Method.CASH) {
      this.gateway.emitBookSeat({
        schedule_id: orderBill.schedule_id,
        seatIds: orderBill.seats.map((seat) => seat.id),
      });
    } else {
      this.gateway.emitHoldSeat({
        schedule_id: orderBill.schedule_id,
        seatIds: orderBill.seats.map((seat) => seat.id),
      });
    }

    return { payUrl: paymentCode.payUrl };
  }

  private async validateBeforeOrder(
    scheduleId: number,
    userId: string,
    requestSeatIds: string[],
  ): Promise<boolean> {
    const redisKey = `seat-hold-${scheduleId}-${userId}`;
    const data = await this.redisClient.get(redisKey);

    if (!data) {
      // socket seat return not yet
      this.gateway.emitCancelBookSeat({
        schedule_id: scheduleId,
        seatIds: requestSeatIds,
      });
      throw new BadRequestException(
        'Your seat hold has expired. Please select seats again.',
      );
    }

    const keys = await this.redisClient.keys(`seat-hold-${scheduleId}-*`);

    if (!keys.length) return true;

    const redisData = await Promise.all(
      keys.map((key) => this.redisClient.get(key)),
    );

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
      const isSeatHeld = requestSeatIds.some((seatId) =>
        parsed.seatIds.includes(seatId),
      );
      if (isSeatHeld) {
        return false;
      }
    }

    // Xóa Redis key của người dùng hiện tại sau khi đặt đơn thành công
    await this.redisClient.del(redisKey);
    return true;
  }

  private async getPaymentCode(orderBill: OrderBillType, clientIp: string): Promise<{ payUrl: string, orderId: string }> {
    switch (Number(orderBill.payment_method_id as Method)) {
      case Method.MOMO:
        return this.momoService.createOrderMomo(orderBill.total_prices);
      case Method.PAYPAL:
        return this.paypalService.createOrderPaypal(orderBill);
      case Method.VISA:
        return this.visaService.createOrderVisa(orderBill);
      case Method.VNPAY:
        return this.vnpayService.createOrderVnPay(
          orderBill.total_prices,
          clientIp,
        );
      case Method.ZALOPAY:
        return this.zalopayService.createOrderZaloPay(orderBill);
      default:
        return {
          payUrl: 'Payment successful by Cash',
          orderId: 'CASH_ORDER_' + new Date().getTime(),
        };
    }
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
      .leftJoinAndSelect('orderExtra.product', 'product')
      .where('order.id NOT IN (:...excludedIds)', { excludedIds: [173, 174] });

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
    if (total === 0) {
      return buildPaginationResponse([], {
        total: 0,
        page: 1,
        take: filters.take,
        totalSuccess: 0,
        totalFailed: 0,
        totalPending: 0,
        revenue: '0',
      });
    }
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

    const countByStatus: Record<string, number> = Object.fromEntries(
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
    if (total === 0) {
      return buildPaginationResponse([], {
        total: 0,
        page: 1,
        take: filters.take,
        totalSuccess: 0,
        totalFailed: 0,
        totalPending: 0,
        revenue: '0',
      });
    }
    const summaries = orders.map((order) =>
      this.mapToBookingSummaryLite(order),
    );

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
      orderDetails: order.orderDetails.map((detail) => ({
        id: detail.id,
        total_each_ticket: detail.total_each_ticket,
        ticketId: detail.ticket.id,
        seat: {
          id: detail.ticket.seat.id,
          seat_row: detail.ticket.seat.seat_row,
          seat_column: detail.ticket.seat.seat_column,
        },
        ticketType: {
          ticket_name: detail.ticket.ticketType.ticket_name,
        },
      })),
      orderExtras:
        order.orderExtras?.map((extra) => ({
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
    const rawDecoded = this.jwtService.verify(qrCode, {
      secret: this.configService.get<string>('jwt.qrSecret'),
    });
    const decoded = rawDecoded as { orderId: number };
    const order = await this.getOrderByIdEmployeeAndAdmin(decoded.orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    //  use all ticket in order by qr code
    const ticketIds = order.orderDetails.map((detail) => detail.ticketId);
    if (ticketIds.length === 0) {
      throw new NotFoundException('No tickets found for this order');
    }
    await this.ticketService.markTicketsAsUsed(ticketIds);
    return order;
  }

  async userProcessOrderPayment(
    orderId: number,
    orderData: OrderBillType,
    userId: string,
    clientIp: string,
  ) {
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
        'promotion',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // 2. Kiểm tra quyền sở hữu đơn hàng
    if (order.user.id !== userId) {
      throw new ForbiddenException('You can only process your own orders');
    }

    // 3. Kiểm tra trạng thái đơn hàng
    if (order.status as StatusOrder !== StatusOrder.PENDING) {
      throw new BadRequestException('Only pending orders can be processed');
    }

    // 4. Validation: Chỉ cho phép thay đổi payment_method_id, các thông tin khác phải giống với order hiện tại
    const currentScheduleId = order.orderDetails[0]?.schedule?.id;
    const currentPromotionId = order.promotion?.id || 1;
    const currentSeatIds = order.orderDetails
      .map((d) => d.ticket.seat.id)
      .sort();
    const inputSeatIds = orderData.seats.map((s) => s.id).sort();

    // Kiểm tra schedule
    if (orderData.schedule_id !== currentScheduleId) {
      throw new BadRequestException(
        'Schedule cannot be changed when re-processing payment',
      );
    }

    // Kiểm tra promotion
    if (orderData.promotion_id !== currentPromotionId) {
      throw new BadRequestException(
        'Promotion cannot be changed when re-processing payment',
      );
    }

    // Kiểm tra seats
    if (JSON.stringify(currentSeatIds) !== JSON.stringify(inputSeatIds)) {
      throw new BadRequestException(
        'Seats cannot be changed when re-processing payment',
      );
    }

    // Kiểm tra products
    const currentProducts = order.orderExtras || [];
    const inputProducts = orderData.products || [];

    if (currentProducts.length !== inputProducts.length) {
      throw new BadRequestException(
        'Products cannot be changed when re-processing payment',
      );
    }

    for (const inputProduct of inputProducts) {
      const currentProduct = currentProducts.find(
        (p) => p.product.id === inputProduct.product_id,
      );
      if (
        !currentProduct ||
        currentProduct.quantity !== inputProduct.quantity
      ) {
        throw new BadRequestException(
          'Products cannot be changed when re-processing payment',
        );
      }
    }
    const price1 = parseFloat(order.total_prices).toFixed(2);
    const price2 = parseFloat(orderData.total_prices).toFixed(2);
    // Kiểm tra total_prices
    if (price1 !== price2) {
      throw new BadRequestException(
        'Total price cannot be changed when re-processing payment',
      );
    }

    // 5. Kiểm tra payment method
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: Number(orderData.payment_method_id) },
    });

    if (!paymentMethod) {
      throw new NotFoundException(
        `Payment method with ID ${orderData.payment_method_id} not found`,
      );
    }

    // 6. Tạo payment URL mới
    const paymentCode = await this.getPaymentCode(orderData, clientIp);

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
  }

  async adminUpdateAndProcessOrder(
    orderId: number,
    updateData: OrderBillType,
    clientIp: string,
    user: JWTUserType,
  ) {
    const existingOrder = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: [
        'user',
        'promotion',
        'transaction',
        'transaction.paymentMethod',
        'orderDetails',
        'orderDetails.ticket',
        'orderDetails.ticket.seat',
        'orderDetails.ticket.ticketType',
        'orderDetails.schedule',
        'orderExtras',
      ],
    });

    if (!existingOrder)
      throw new NotFoundException(`Order ${orderId} not found`);
    if (existingOrder.status as StatusOrder !== StatusOrder.PENDING) {
      throw new BadRequestException('Only pending orders can be updated');
    }

    if (updateData.schedule_id !== existingOrder.orderDetails[0].schedule.id) {
      throw new BadRequestException('Cannot change schedule of existing order');
    }

    const products = updateData.products || [];
    let orderExtras: Product[] = [];
    if (products.length > 0) {
      const productIds = products.map((p) => p.product_id);
      orderExtras = await this.getOrderExtraByIds(productIds);
    }

    const isPromotionChanged =
      updateData.promotion_id !== existingOrder.promotion?.id;
    const newPromotion = isPromotionChanged
      ? await this.getPromotionById(updateData.promotion_id)
      : existingOrder.promotion;
    const isChangeCustomerId = updateData.customer_id !== existingOrder.customer_id;
    let newCustomer: User | null = null;
    if (isChangeCustomerId) {
      if (!updateData.customer_id) {
        throw new BadRequestException('Customer ID is required when changing customer');
      }
      newCustomer = await this.getUserById(updateData.customer_id);
      if (!newCustomer) {
        throw new NotFoundException(`Customer with ID ${updateData.customer_id} not found`);
      }
    }
    if (isPromotionChanged && newPromotion?.id !== 1) {
      if (
        (user.role_id as Role === Role.EMPLOYEE || user.role_id as Role === Role.ADMIN) &&
        !updateData.customer_id
      ) {
        throw new ConflictException(
          'Staff must provide customer ID when using promotion',
        );
      }
      const now = new Date();
      if (
        !newPromotion?.start_time ||
        !newPromotion?.end_time ||
        now < newPromotion?.start_time ||
        now > newPromotion?.end_time
      ) {
        throw new BadRequestException('Promotion is not valid at this time');
      }
      if (user.role_id as Role !== Role.USER) {
        // check score of customer 
        if (newCustomer && newPromotion.exchange > newCustomer.score) {
          throw new ConflictException(
            'Not enough points to use this promotion for customer',
          );
        }


      }
    }

    const ticketTotal = existingOrder.orderDetails.reduce(
      (sum, d) => sum + Number(d.total_each_ticket),
      0,
    );
    const productTotal = calculateProductTotal(orderExtras, updateData);
    const totalBeforeDiscount = ticketTotal + productTotal;

    const isPercentage = newPromotion?.promotionType?.type === 'percentage';
    const discountValue = parseFloat(newPromotion?.discount ?? '0');
    const promotionAmount = isPercentage
      ? Math.round((totalBeforeDiscount * discountValue) / 100)
      : Math.round(discountValue);

    const totalAfterDiscount = totalBeforeDiscount - promotionAmount;
    const inputTotal = parseFloat(updateData.total_prices.toString());
    if (Math.abs(totalAfterDiscount - inputTotal) > 0.01) {
      throw new BadRequestException(
        'Total price mismatch. Please refresh and try again.',
      );
    }

    const ticketRatio = ticketTotal / totalBeforeDiscount || 0;
    const ticketDiscountAmount = Math.round(promotionAmount * ticketRatio);
    const productDiscountAmount = promotionAmount - ticketDiscountAmount;

    //  Update lại total_each_ticket nếu mã thay đổi
    if (isPromotionChanged) {
      for (const detail of existingOrder.orderDetails) {
        const oldPrice = Number(detail.total_each_ticket);
        const ratio = oldPrice / ticketTotal || 0;
        const discount = Math.round(ticketDiscountAmount * ratio);
        detail.total_each_ticket = roundUpToNearest(
          oldPrice - discount,
          1000,
        ).toString();
      }
      await this.orderDetailRepository.save(existingOrder.orderDetails);
    }

    //  Update lại orderExtras
    await this.orderExtraRepository.remove(existingOrder.orderExtras);
    const totalProductBeforePromo = orderExtras.reduce((sum, p) => {
      const qty = products.find((x) => x.product_id === p.id)?.quantity || 0;
      return sum + Number(p.price) * qty;
    }, 0);

    const extrasToSave: OrderExtra[] = [];

    for (const product of orderExtras) {
      const quantity =
        products.find((x) => x.product_id === product.id)?.quantity || 0;
      if (quantity <= 0) continue;

      let basePrice = Number(product.price);
      if ((product.type.toLowerCase() as ProductTypeEnum) === ProductTypeEnum.COMBO) {
        const combo = product as Combo;
        if (combo.discount) {
          basePrice *= 1 - combo.discount / 100;
        }
      }

      let unitPrice = basePrice;

      if (
        promotionAmount > 0 &&
        isPromotionChanged &&
        totalProductBeforePromo > 0
      ) {
        const shareRatio = (basePrice * quantity) / totalProductBeforePromo;
        const discount = isPercentage
          ? basePrice * (productDiscountAmount / totalProductBeforePromo)
          : (productDiscountAmount * shareRatio) / quantity;

        unitPrice = Math.round(basePrice - discount);
      }

      const orderExtra = this.orderExtraRepository.create({
        quantity,
        unit_price: roundUpToNearest(unitPrice, 1000).toString(),
        product,
        order: existingOrder,
        status:
          Number(updateData.payment_method_id as Method) === Method.CASH
            ? StatusOrder.SUCCESS
            : StatusOrder.PENDING,
      });

      extrasToSave.push(orderExtra);
    }

    if (extrasToSave.length > 0) {
      await this.orderExtraRepository.save(extrasToSave);
    }

    //  Update lại order // nếu là cash thì success
    await this.orderRepository.update(existingOrder.id, {
      total_prices: totalAfterDiscount.toString(),
      promotion: newPromotion,
      order_date: new Date(),
      status:
        Number(updateData.payment_method_id as Method) === Method.CASH
          ? StatusOrder.SUCCESS
          : StatusOrder.PENDING,
      customer_id: isChangeCustomerId ? newCustomer?.id : existingOrder.customer_id,
    });

    //  Update lại transaction
    const paymentCode = await this.getPaymentCode(updateData, clientIp);
    if (!paymentCode?.payUrl || !paymentCode?.orderId) {
      throw new BadRequestException('Failed to create payment URL');
    }

    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: Number(updateData.payment_method_id) },
    });

    if (paymentMethod) {
      existingOrder.transaction.paymentMethod = paymentMethod;
    }

    existingOrder.transaction.transaction_code = paymentCode.orderId;
    existingOrder.transaction.transaction_date = new Date();
    existingOrder.transaction.status =
      Number(updateData.payment_method_id as Method) === Method.CASH
        ? StatusOrder.SUCCESS
        : StatusOrder.PENDING;
    await this.transactionRepository.save(existingOrder.transaction);
    // update schedule seat in db
    // If payment method is CASH, immediately change seat status to BOOKED
    if (Number(updateData.payment_method_id as Method) === Method.CASH) {
      const seatIds = updateData.seats.map((seat) => seat.id);
      await this.changeStatusScheduleSeatToBooked(
        seatIds,
        updateData.schedule_id,
      );
    }
    //  Cộng điểm nếu là thanh toán CASH + promotion mới
    if (
      updateData.customer_id &&
      Number(updateData.payment_method_id as Method) === Method.CASH &&
      isPromotionChanged
    ) {
      const customer = await this.userRepository.findOne({
        where: { id: updateData.customer_id },
        relations: ['role'],
      });

      if (!customer || customer.role.role_id as Role !== Role.USER) {
        throw new ForbiddenException('Invalid customer for point accumulation');
      }

      const earnedScore =
        Math.floor(totalAfterDiscount / 1000) - (newPromotion?.exchange ?? 0);
      customer.score += earnedScore;

      await this.userRepository.save(customer);
      await this.historyScoreRepository.save({
        score_change: earnedScore,
        user: customer,
        order: existingOrder,
      });
    }
    // socket emit for order update for cash
    if (Number(updateData.payment_method_id as Method) === Method.CASH) {
      this.gateway.emitBookSeat({
        schedule_id: updateData.schedule_id,
        seatIds: updateData.seats.map((seat) => seat.id),
      });
    }
    return {
      payUrl: paymentCode.payUrl,
    };
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
        'orderExtras',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // check status
    if (order.status as StatusOrder !== StatusOrder.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }
    // 1. Free up the seats that were booked for this order
    if (order.orderDetails && order.orderDetails.length > 0) {
      const scheduleId = order.orderDetails[0].schedule.id;
      const seatIds = order.orderDetails.map((detail) => detail.ticket.seat.id);

      // Update schedule seats status to NOT_YET
      const scheduleSeats = await this.scheduleSeatRepository.find({
        where: {
          seat: { id: In(seatIds) },
          schedule: { id: scheduleId },
        },
      });

      for (const scheduleSeat of scheduleSeats) {
        if (scheduleSeat.status as StatusSeat === StatusSeat.HELD) {
          scheduleSeat.status = StatusSeat.NOT_YET;
        }
      }

      await this.scheduleSeatRepository.save(scheduleSeats);

      // Socket notification for seat status change
      this.gateway.emitCancelBookSeat({
        schedule_id: scheduleId,
        seatIds: seatIds,
      });
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
      const ticketIds = order.orderDetails.map((detail) => detail.ticket.id);
      await this.ticketRepository.update(
        { id: In(ticketIds) },
        { status: false },
      );
    }

    // 6. Save the order
    await this.orderRepository.save(order);

    return {
      message: 'Order cancelled successfully',
    };
  }


  async checkAllOrdersStatusByGateway() {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() - 1); // lùi về hôm qua

    const startOfDay = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0
    ));

    const endOfDay = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23, 59, 59
    ));
    // const startOfDay = new Date(2025, 6, 29, 0, 0, 0);    // ngày 29/7/2025 lúc 00:00:00
    // const endOfDay = new Date(2025, 6, 29, 23, 59, 59);   // ngày 29/7/2025 lúc 23:59:59

    const orders = await this.orderRepository.find({
      where: { order_date: Between(startOfDay, endOfDay) },
      relations: ['transaction', 'transaction.paymentMethod'],
    });

    const result: Record<
      PaymentGateway,
      { totalSuccess: number; totalFailed: number; totalRevenue: number }
    > = {
      MOMO: { totalSuccess: 0, totalFailed: 0, totalRevenue: 0 },
      PAYPAL: { totalSuccess: 0, totalFailed: 0, totalRevenue: 0 },
      VISA: { totalSuccess: 0, totalFailed: 0, totalRevenue: 0 },
      VNPAY: { totalSuccess: 0, totalFailed: 0, totalRevenue: 0 },
      ZALOPAY: { totalSuccess: 0, totalFailed: 0, totalRevenue: 0 },
      CASH: { totalSuccess: 0, totalFailed: 0, totalRevenue: 0 },
    };

    const methodMap: Record<number, PaymentGateway> = {
      [Method.CASH]: PaymentGateway.CASH,
      [Method.MOMO]: PaymentGateway.MOMO,
      [Method.PAYPAL]: PaymentGateway.PAYPAL,
      [Method.VISA]: PaymentGateway.VISA,
      [Method.VNPAY]: PaymentGateway.VNPAY,
      [Method.ZALOPAY]: PaymentGateway.ZALOPAY,
    };

    const queryMethodStatus = async (
      method: PaymentGateway,
      code: string,
      date: Date,
    ) => {
      switch (method as PaymentGateway) {
        case PaymentGateway.MOMO:
          return await this.momoService.queryOrderStatusMomo(code);
        case PaymentGateway.PAYPAL:
          return await this.paypalService.queryOrderStatusPaypal(code);
        case PaymentGateway.VISA:
          return await this.visaService.queryOrderStatusVisa(code);
        case PaymentGateway.VNPAY:
          return await this.vnpayService.queryOrderStatusVnpay(
            code,
            formatDate(date),
          );
        case PaymentGateway.ZALOPAY:
          return await this.zalopayService.queryOrderStatusZaloPay(code);
        default:
          throw new Error(`Unsupported payment method: ${method}`);
      }
    };

    const tasks = orders.map(async (order) => {
      const { transaction, status, total_prices, order_date } = order;
      const methodId = transaction?.paymentMethod?.id;
      const code = transaction?.transaction_code;

      if (!methodId || !code) return;

      const method = methodMap[methodId];
      if (!method) return;

      if (method as PaymentGateway === PaymentGateway.CASH) {
        if (status as StatusOrder === StatusOrder.SUCCESS) {
          result[method].totalSuccess++;
          result[method].totalRevenue += Number(total_prices) || 0;
        } else {
          result[method].totalFailed++;
        }
        return;
      }

      try {
        const res = await queryMethodStatus(method, code, order_date);
        if (res?.paid) {
          result[method].totalSuccess++;
          result[method].totalRevenue += Number(res.total) || 0;
        } else {
          result[method].totalFailed++;
        }
      } catch (err) {
        result[method].totalFailed++;
      }
    });

    await Promise.allSettled(tasks);

    // // optimize call db
    const paymentMethods = await this.paymentMethodRepository.find();
    const paymentMethodMap = new Map<string, PaymentMethod>();
    paymentMethods.forEach((pm) =>
      paymentMethodMap.set(pm.name.toUpperCase(), pm),
    );

    const reportDate = startOfDay.toISOString().slice(0, 10);

    for (const [method, summary] of Object.entries(result)) {
      const methodEntity = paymentMethodMap.get(method);
      if (!methodEntity) {
        console.warn(
          `Payment method ${method} not found, skipping summary record`,
        );
        continue;
      }

      const recordData: Omit<DailyTransactionSummary, 'id'> = {
        reportDate,
        totalOrders: summary.totalSuccess + summary.totalFailed,
        totalSuccess: summary.totalSuccess,
        totalFailed: summary.totalFailed,
        totalAmount: summary.totalRevenue,
        paymentMethod: methodEntity,
      };

      const record = this.dailyTransactionSummaryRepository.create(recordData);
      await this.dailyTransactionSummaryRepository.save(record);
    }

    return result;
  }
  //   async checkQueryOrderByGateway(orderId: number) {
  //   const order = await this.orderRepository.findOne({
  //     where: { id: orderId },
  //     relations: ['transaction', 'transaction.paymentMethod'],
  //   });
  //   if (!order || !order.transaction || !order.transaction.paymentMethod) {
  //     throw new NotFoundException(
  //       `Order with ID ${orderId} not found or has no transaction`,
  //     );
  //   }
  //   switch (order.transaction.paymentMethod.id) {
  //     case Method.MOMO:
  //       return this.momoService.queryOrderStatusMomo(
  //         order.transaction.transaction_code,
  //       );
  //     case Method.PAYPAL:
  //       return this.paypalService.queryOrderStatusPaypal(
  //         order.transaction.transaction_code,
  //       );
  //     case Method.VISA:
  //       return this.visaService.queryOrderStatusVisa(
  //         order.transaction.transaction_code,
  //       );
  //     case Method.VNPAY:
  //       return this.vnpayService.queryOrderStatusVnpay(
  //         order.transaction.transaction_code,
  //         formatDate(order.order_date),
  //       );
  //     case Method.ZALOPAY:
  //       return this.zalopayService.queryOrderStatusZaloPay(
  //         order.transaction.transaction_code,
  //       );
  //     default:
  //       throw new BadRequestException(
  //         `Unsupported payment method for query: ${order.transaction.paymentMethod.name}`,
  //       );
  //   }
  // }

  // refund order
  // async refundOrder(orderId: number) {

  //   // 1. Lấy order hiện tại
  //   const existingOrder = await this.orderRepository.createQueryBuilder('order')
  //     .leftJoinAndSelect('order.user', 'user')
  //     .leftJoinAndSelect('order.promotion', 'promotion')
  //     .leftJoinAndSelect('order.transaction', 'transaction')
  //     .leftJoinAndSelect('transaction.paymentMethod', 'paymentMethod')
  //     .leftJoinAndSelect('order.orderDetails', 'orderDetail')
  //     .leftJoinAndSelect('orderDetail.ticket', 'ticket')
  //     .leftJoinAndSelect('ticket.seat', 'seat')
  //     .leftJoinAndSelect('ticket.ticketType', 'ticketType')
  //     .leftJoinAndSelect('orderDetail.schedule', 'schedule')
  //     .leftJoinAndSelect('schedule.movie', 'movie')
  //     .leftJoinAndSelect('order.orderExtras', 'orderExtras')
  //     .where('order.id = :orderId', { orderId })
  //     .getOne();

  //   if (!existingOrder) {
  //     throw new NotFoundException(`Order with ID ${orderId} not found`);
  //   }
  //   // 2. Kiểm tra trạng thái đơn hàng
  //   if (existingOrder.status !== StatusOrder.SUCCESS) {
  //     throw new BadRequestException('Only successful orders can be refunded');
  //   }

  //   // // check schedule is in Date now
  //   const currentDate = new Date();
  //   const scheduleStartTime = existingOrder.orderDetails[0]?.schedule?.start_movie_time;
  //   if (scheduleStartTime && scheduleStartTime < currentDate) {
  //     throw new BadRequestException('Cannot refund orders for past schedules');
  //   }

  //   if (!existingOrder.transaction || !existingOrder.transaction.paymentMethod) {
  //     throw new BadRequestException('Transaction or Payment Method not found');
  //   }
  //   // create request
  //   const gateway = existingOrder.transaction?.paymentMethod?.name?.toUpperCase();
  //   const refundExists = await this.orderRefundRepository.findOne({
  //     where: {
  //       order: { id: orderId },
  //       payment_gateway: gateway as PaymentGateway,
  //       refund_status: RefundStatus.SUCCESS
  //     },
  //   });
  //   if (refundExists) {
  //     throw new BadRequestException('Order already refunded');
  //   }
  //   try {
  //     await this.createOrderRefund(gateway, orderId);
  //   } catch (error) {
  //     // console.error(`Error creating refund for Order ID ${orderId}:`, error);
  //     throw error;

  //   }

  //   // 3. Giải phóng ghế đã đặt
  //   if (existingOrder.orderDetails && existingOrder.orderDetails.length > 0) {
  //     const scheduleId = existingOrder.orderDetails[0].schedule.id;
  //     const seatIds = existingOrder.orderDetails.map(detail => detail.ticket.seat.id);

  //     // Cập nhật trạng thái ghế về NOT_YET
  //     const scheduleSeats = await this.scheduleSeatRepository.find({
  //       where: {
  //         seat: { id: In(seatIds) },
  //         schedule: { id: scheduleId }
  //       }
  //     });
  //     await this.scheduleSeatRepository.update(
  //       {
  //         seat: { id: In(seatIds) },
  //         schedule: { id: scheduleId }
  //       },
  //       { status: StatusSeat.NOT_YET }
  //     );

  //     await this.scheduleSeatRepository.save(scheduleSeats);

  //     // Socket thông báo hủy đặt ghế
  //     this.gateway.emitCancelBookSeat({
  //       schedule_id: scheduleId,
  //       seatIds: seatIds
  //     });
  //   }
  //   // 4. Cập nhật trạng thái đơn hàng
  //   existingOrder.status = StatusOrder.REFUND;
  //   // 5. Cập nhật trạng thái giao dịch
  //   if (existingOrder.transaction) {
  //     existingOrder.transaction.status = StatusOrder.REFUND;
  //     await this.transactionRepository.save(existingOrder.transaction);
  //   }
  //   // 6. Cập nhật trạng thái order extras
  //   if (existingOrder.orderExtras && existingOrder.orderExtras.length > 0) {
  //     for (const extra of existingOrder.orderExtras) {
  //       extra.status = StatusOrder.REFUND;
  //     }
  //     await this.orderExtraRepository.save(existingOrder.orderExtras);
  //   }
  //   // 7. Cập nhật trạng thái vé status = false
  //   if (existingOrder.orderDetails && existingOrder.orderDetails.length > 0) {
  //     const ticketIds = existingOrder.orderDetails.map(detail => detail.ticket.id);
  //     await this.ticketRepository.update(
  //       { id: In(ticketIds) },
  //       { status: false }
  //     );
  //   }
  //   // 8. Lưu lại order
  //   await this.orderRepository.save(existingOrder);

  //   return {
  //     message: 'Order refunded successfully',
  //   };
  // }
  // async refundOrderBySchedule(scheduleId: number) {
  //   const orders = await this.orderRepository.find({
  //     where: {
  //       orderDetails: {
  //         schedule: { id: scheduleId },
  //       },
  //       status: StatusOrder.SUCCESS,
  //     },
  //     relations: [
  //       'transaction',
  //       'transaction.paymentMethod',
  //       'orderDetails',
  //       'orderDetails.ticket',
  //       'orderDetails.ticket.seat',
  //       'orderDetails.schedule',
  //       'orderExtras',
  //     ],
  //   });

  //   if (orders.length === 0) {
  //     throw new NotFoundException(`No successful orders found for schedule ID ${scheduleId}`);
  //   }

  //   const allSeatIds = new Set<string>();
  //   let totalRefundSuccess = 0;
  //   let totalRefundFailed = 0;

  //   for (const eachOrder of orders) {
  //     const gateway = eachOrder.transaction?.paymentMethod?.name?.toUpperCase();

  //     if (!gateway) {
  //       console.warn(`Skipping order ${eachOrder.id} due to missing payment method`);
  //       totalRefundFailed++;
  //       continue;
  //     }

  //     const refundExists = await this.orderRefundRepository.findOne({
  //       where: {
  //         order: { id: eachOrder.id },
  //         payment_gateway: gateway as PaymentGateway,
  //         refund_status: RefundStatus.SUCCESS,
  //       },
  //     });

  //     if (refundExists) {
  //       console.log(`Order ID ${eachOrder.id} already refunded, skipping`);
  //       continue;
  //     }

  //     try {
  //       await this.createOrderRefund(gateway, eachOrder.id);
  //     } catch (error) {
  //       console.error(`Error creating refund for Order ID ${eachOrder.id}:`, error);
  //       totalRefundFailed++;
  //       continue;
  //     }

  //     // Giải phóng ghế đã đặt
  //     if (eachOrder.orderDetails && eachOrder.orderDetails.length > 0) {
  //       const seatIds = eachOrder.orderDetails.map(detail => detail.ticket.seat.id);
  //       seatIds.forEach(id => allSeatIds.add(id));

  //       await this.scheduleSeatRepository.update(
  //         {
  //           seat: { id: In(seatIds) },
  //           schedule: { id: scheduleId }
  //         },
  //         { status: StatusSeat.NOT_YET }
  //       );
  //     }

  //     // Cập nhật trạng thái đơn hàng
  //     eachOrder.status = StatusOrder.REFUND;

  //     // Cập nhật trạng thái giao dịch
  //     if (eachOrder.transaction) {
  //       eachOrder.transaction.status = StatusOrder.REFUND;
  //       await this.transactionRepository.save(eachOrder.transaction);
  //     }

  //     // Cập nhật trạng thái order extras
  //     if (eachOrder.orderExtras && eachOrder.orderExtras.length > 0) {
  //       for (const extra of eachOrder.orderExtras) {
  //         extra.status = StatusOrder.REFUND;
  //       }
  //       await this.orderExtraRepository.save(eachOrder.orderExtras);
  //     }

  //     // Cập nhật trạng thái vé
  //     if (eachOrder.orderDetails && eachOrder.orderDetails.length > 0) {
  //       const ticketIds = eachOrder.orderDetails.map(detail => detail.ticket.id);
  //       await this.ticketRepository.update(
  //         { id: In(ticketIds) },
  //         { status: false }
  //       );
  //     }

  //     await this.orderRepository.save(eachOrder);
  //     totalRefundSuccess++;
  //   }

  //   // Gửi socket 1 lần duy nhất
  //   if (allSeatIds.size > 0) {
  //     this.gateway.emitCancelBookSeat({
  //       schedule_id: scheduleId,
  //       seatIds: Array.from(allSeatIds),
  //     });
  //   }

  //   return {
  //     totalOrders: orders.length,
  //     totalRefundSuccess,
  //     totalRefundFailed,
  //   };
  // }

  // private async createOrderRefund(gateway: string, orderId: number) {
  //   switch (gateway) {
  //     case PaymentGateway.MOMO:
  //     case 'MOMO':
  //       await this.momoService.createRefund({ orderId });
  //       break;

  //     case PaymentGateway.PAYPAL:
  //     case 'PAYPAL':
  //       await this.paypalService.createRefund({ orderId });
  //       break;

  //     case PaymentGateway.VISA:
  //     case 'VISA':
  //       await this.visaService.createRefund({ orderId });
  //       break;

  //     case 'VNPAY':
  //       // VNPAY refund is not implemented - skip refund API call
  //       console.log(`VNPAY refund for order ${orderId} - only status update, no API refund`);
  //       break;

  //     case 'ZALOPAY':
  //       // ZALOPAY refund is not implemented - skip refund API call
  //       console.log(`ZALOPAY refund for order ${orderId} - only status update, no API refund`);
  //       break;

  //     case 'CASH':
  //       // Cash payment doesn't need API refund, just update status
  //       console.log(`Cash order ${orderId} refund processed locally`);
  //       break;

  //     default:
  //       throw new BadRequestException(`Unsupported payment gateway: ${gateway}`);
  //   }
  // }

  // async adminUpdateAndProcessOrder(
  //   orderId: number,
  //   updateData: OrderBillType,
  //   clientIp: string,
  //   user: JWTUserType,
  // ) {
  //   try {
  //     const existingOrder = await this.orderRepository.createQueryBuilder('order')
  //       .leftJoinAndSelect('order.user', 'user')
  //       .leftJoinAndSelect('order.promotion', 'promotion')
  //       .leftJoinAndSelect('order.transaction', 'transaction')
  //       .leftJoinAndSelect('transaction.paymentMethod', 'paymentMethod')
  //       .leftJoinAndSelect('order.orderDetails', 'orderDetail')
  //       .leftJoinAndSelect('orderDetail.ticket', 'ticket')
  //       .leftJoinAndSelect('ticket.seat', 'seat')
  //       .leftJoinAndSelect('ticket.ticketType', 'ticketType')
  //       .leftJoinAndSelect('orderDetail.schedule', 'schedule')
  //       .leftJoinAndSelect('schedule.movie', 'movie')
  //       .leftJoinAndSelect('order.orderExtras', 'orderExtras')
  //       .where('order.id = :orderId', { orderId })
  //       .getOne();

  //     if (!existingOrder) throw new NotFoundException(`Order ${orderId} not found`);
  //     if (existingOrder.status !== StatusOrder.PENDING)
  //       throw new BadRequestException('Only pending orders can be updated');

  //     if (updateData.schedule_id !== existingOrder.orderDetails[0].schedule.id) {
  //       throw new BadRequestException('Cannot change schedule of existing order');
  //     }

  //     const products = updateData.products || [];
  //     let orderExtras: Product[] = [];
  //     if (products.length > 0) {
  //       const productIds = products.map(p => p.product_id);
  //       orderExtras = await this.getOrderExtraByIds(productIds);
  //     }

  //     const newPromotion =
  //       updateData.promotion_id !== existingOrder.promotion?.id
  //         ? await this.getPromotionById(updateData.promotion_id)
  //         : existingOrder.promotion;

  //     // Nếu đổi mã giảm giá → validate lại promotion
  //     if (newPromotion && newPromotion.id !== existingOrder.promotion?.id) {
  //       if (newPromotion.id !== 1) {
  //         const now = new Date();
  //         if (!newPromotion.start_time || !newPromotion.end_time || newPromotion.start_time > now || newPromotion.end_time < now) {
  //           throw new BadRequestException('Promotion is not valid at this time');
  //         }

  //         const checkUser = await this.getUserById(user.account_id);
  //         if (newPromotion.exchange > checkUser.score) {
  //           throw new ConflictException('Not enough points to use this promotion');
  //         }

  //         if ((user.role_id === Role.EMPLOYEE || user.role_id === Role.ADMIN) && !updateData.customer_id) {
  //           throw new ConflictException('Staff must provide customer ID when using promotion');
  //         }
  //       }
  //     }

  //     const schedule = existingOrder.orderDetails[0].schedule;
  //     const seatsInOrder = existingOrder.orderDetails.map(d => ({
  //       id: d.ticket.seat.id,
  //       audience_type: d.ticket.ticketType.audience_type,
  //     }));

  //     const newScheduleSeats = await this.getScheduleSeatsByIds(seatsInOrder.map(s => s.id), schedule.id);
  //     const audienceTypes = seatsInOrder.map(s => s.audience_type);
  //     const ticketTypes = await this.getTicketTypesByAudienceTypes(audienceTypes);

  //     let totalSeats = 0;
  //     let totalProduct = 0;
  //     let totalPrice = 0;
  //     let seatPriceMap = new Map<string, number>();
  //     let promotionAmount = 0;
  //     let seatDiscount = 0;
  //     let productDiscount = 0;

  //     const isPercentage = newPromotion?.promotionType?.type === 'percentage';
  //     const promotionDiscount = parseFloat(newPromotion?.discount ?? '0');

  //     if (newPromotion.id !== existingOrder.promotion?.id) {
  //       for (const seatData of seatsInOrder) {
  //         const scheduleSeat = newScheduleSeats.find(s => s.seat.id === seatData.id)!;
  //         const ticketType = ticketTypes.find(t => t.audience_type === seatData.audience_type);
  //         const basePrice = scheduleSeat.seat.seatType.seat_type_price;
  //         const discount = parseFloat(ticketType?.discount ?? '0');
  //         const finalPrice = applyAudienceDiscount(basePrice, discount);
  //         seatPriceMap.set(seatData.id, finalPrice);
  //         totalSeats += finalPrice;
  //       }

  //       if (orderExtras.length > 0) {
  //         totalProduct = calculateProductTotal(orderExtras, updateData);
  //       }

  //       const totalBeforePromotion = totalSeats + totalProduct;
  //       promotionAmount = isPercentage
  //         ? Math.round(totalBeforePromotion * (promotionDiscount / 100))
  //         : Math.round(promotionDiscount);

  //       totalPrice = totalBeforePromotion - promotionAmount;

  //       const inputTotal = parseFloat(updateData.total_prices.toString());
  //       if (Math.abs(totalPrice - inputTotal) > 0.01) {
  //         throw new BadRequestException('Total price mismatch. Please refresh and try again.');
  //       }

  //       const seatRatio = totalSeats / (totalSeats + totalProduct || 1);
  //       seatDiscount = Math.round(promotionAmount * seatRatio);
  //       productDiscount = promotionAmount - seatDiscount;

  //       // Xoá dữ liệu cũ
  //       await this.orderDetailRepository.remove(existingOrder.orderDetails);
  //       await this.ticketRepository.remove(existingOrder.orderDetails.map(d => d.ticket));
  //     } else {
  //       // Nếu mã khuyến mãi giữ nguyên
  //       totalProduct = calculateProductTotal(orderExtras, updateData);
  //       totalPrice = existingOrder.orderDetails.reduce((sum, d) => sum + Number(d.total_each_ticket), 0) + totalProduct;

  //       await this.orderExtraRepository.remove(existingOrder.orderExtras);
  //     }

  //     // 9. Tạo lại OrderExtras
  //     const extrasToSave: OrderExtra[] = [];
  //     if (orderExtras.length > 0) {
  //       const totalBeforePromo = orderExtras.reduce((sum, p) => {
  //         const qty = products.find(i => i.product_id === p.id)?.quantity || 0;
  //         return sum + Number(p.price) * qty;
  //       }, 0);

  //       for (const product of orderExtras) {
  //         const quantity = products.find(i => i.product_id === product.id)?.quantity || 0;
  //         if (quantity > 0) {
  //           const basePrice = Number(product.price);
  //           const isCombo = product.type.toLowerCase() === ProductTypeEnum.COMBO;
  //           const shareRatio = (basePrice * quantity) / totalBeforePromo || 0;

  //           let finalUnitPrice = basePrice;
  //           if (promotionAmount > 0 && newPromotion.id !== existingOrder.promotion?.id) {
  //             const discountShare = isPercentage
  //               ? basePrice * (productDiscount / totalBeforePromo)
  //               : (productDiscount * shareRatio) / quantity;
  //             finalUnitPrice = Math.round(basePrice - discountShare);
  //           }

  //           if (isCombo) {
  //             const comboProduct = product as Combo;
  //             if (comboProduct.discount && !isNaN(comboProduct.discount)) {
  //               finalUnitPrice *= (1 - comboProduct.discount / 100);
  //             }
  //           }

  //           const extra = this.orderExtraRepository.create({
  //             quantity,
  //             unit_price: roundUpToNearest(finalUnitPrice, 1000).toString(),
  //             order: existingOrder,
  //             product,
  //             status: Number(updateData.payment_method_id) === Method.CASH
  //               ? StatusOrder.SUCCESS
  //               : StatusOrder.PENDING,
  //           });

  //           extrasToSave.push(extra);
  //         }
  //       }
  //       await this.orderExtraRepository.save(extrasToSave);
  //     }

  //     // 10. Cập nhật Order
  //     await this.orderRepository.update({ id: existingOrder.id }, {
  //       total_prices: updateData.total_prices.toString(),
  //       promotion: newPromotion,
  //       order_date: new Date(),
  //     });

  //     // 11. Update Transaction
  //     const paymentCode = await this.getPaymentCode(updateData, clientIp);
  //     if (!paymentCode?.payUrl || !paymentCode?.orderId) {
  //       throw new BadRequestException('Failed to create payment URL');
  //     }

  //     const paymentMethod = await this.paymentMethodRepository.findOne({
  //       where: { id: Number(updateData.payment_method_id) }
  //     });

  //     if (paymentMethod) {
  //       existingOrder.transaction.paymentMethod = paymentMethod;
  //     }
  //     existingOrder.transaction.transaction_code = paymentCode.orderId;
  //     existingOrder.transaction.transaction_date = new Date();
  //     await this.transactionRepository.save(existingOrder.transaction);

  //     // 12. Add điểm nếu thanh toán bằng tiền mặt
  //     if (
  //       updateData.customer_id &&
  //       updateData.customer_id.trim() !== '' &&
  //       Number(updateData.payment_method_id) === Method.CASH &&
  //       newPromotion.id !== existingOrder.promotion?.id
  //     ) {
  //       const customer = await this.userRepository.findOne({
  //         where: { id: updateData.customer_id },
  //         relations: ['role'],
  //       });

  //       if (!customer || customer.role.role_id !== Role.USER) {
  //         throw new ForbiddenException('Invalid customer for point accumulation');
  //       }

  //       const earnedScore = Math.floor(totalPrice / 1000) - (newPromotion?.exchange ?? 0);
  //       customer.score += earnedScore;

  //       await this.userRepository.save(customer);
  //       await this.historyScoreRepository.save({
  //         score_change: earnedScore,
  //         user: customer,
  //         order: existingOrder,
  //       });
  //     }

  //     return {
  //       payUrl: paymentCode.payUrl,
  //     };

  //   } catch (error) {
  //     throw error;
  //   }
  // }
}
