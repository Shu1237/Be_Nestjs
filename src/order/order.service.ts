import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from 'src/typeorm/entities/order/order';
import { OrderDetail } from 'src/typeorm/entities/order/order-detail';
import { PaymentMethod } from 'src/typeorm/entities/order/payment-method';
import { Transaction } from 'src/typeorm/entities/order/transaction';
import { HoldSeatType, JWTUserType, OrderBillType, SeatInfo } from 'src/utils/type';
import { User } from 'src/typeorm/entities/user/user';
import { Promotion } from 'src/typeorm/entities/promotion/promotion';
import { Schedule } from 'src/typeorm/entities/cinema/schedule';
import { Ticket } from 'src/typeorm/entities/order/ticket';
import { TicketType } from 'src/typeorm/entities/order/ticket-type';
import { PayPalService } from './payment-menthod/paypal/paypal.service';
import { Method } from 'src/enum/payment-menthod.enum';
import { VisaService } from './payment-menthod/visa/visa.service';
import { VnpayService } from './payment-menthod/vnpay/vnpay.service';
import { MomoService } from './payment-menthod/momo/momo.service';
import { ZalopayService } from './payment-menthod/zalopay/zalopay.service';
import { ScheduleSeat } from 'src/typeorm/entities/cinema/schedule_seat';
import { StatusSeat } from 'src/enum/status_seat.enum';
import Redis from 'ioredis';
import { StatusOrder } from 'src/enum/status-order.enum';
import { MyGateWay } from 'src/gateways/seat.gateway';
import { SeatService } from 'src/seat/seat.service';
import { OrderExtra } from 'src/typeorm/entities/order/order-extra';
import { Product } from 'src/typeorm/entities/item/product';
import { applyAudienceDiscount, calculateProductTotal, roundUpToNearest } from 'src/utils/helper';
import * as jwt from 'jsonwebtoken';
import { ProductTypeEnum } from 'src/enum/product.enum';
import { Combo } from 'src/typeorm/entities/item/combo';



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





    private readonly momoService: MomoService,
    private readonly paypalService: PayPalService,
    private readonly visaService: VisaService,
    private readonly vnpayService: VnpayService,
    private readonly zalopayService: ZalopayService,
    private readonly seatService: SeatService,
    private readonly gateway: MyGateWay,




    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,


  ) { }

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
      where: { id: promotionId },
      relations: ['promotionType']
    });
    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${promotionId} not found`);
    }
    return promotion;
  }

  private async getScheduleById(scheduleId: number) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
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


      // Fetch seat IDs
      const seatIds = orderBill.seats.map((seat: SeatInfo) => seat.id);
      const scheduleId = orderBill.schedule_id.toString();

      // check redis
      await this.validateBeforeOrder(scheduleId, user.id, seatIds);

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
      // console.log(promotion)



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
      // Create order
      const newOrder = await this.orderRepository.save({
        total_prices: orderBill.total_prices,
        status: Number(orderBill.payment_method_id) === Method.CASH ? StatusOrder.SUCCESS : StatusOrder.PENDING,
        user,
        promotion,
      });

      const transaction = await this.transactionRepository.save({
        transaction_code: paymentCode.orderId,
        transaction_date: new Date(),
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

        seat.status = StatusSeat.BOOKED;
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
        const isCombo = item.product.type === ProductTypeEnum.COMBO;


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
      if (Method.CASH) {
        this.gateway.onBookSeat({
          schedule_id: orderBill.schedule_id,
          seatIds: orderBill.seats.map(seat => seat.id)
        });
      }
      return { payUrl: paymentCode.payUrl };
    } catch (error) {
      throw error;
    }
  }

  private async validateBeforeOrder(
    scheduleId: string,
    userId: string,
    requestSeatIds: string[],
  ): Promise<void> {

    const redisKey = `seat-hold-${scheduleId}-${userId}`;
    // const data = await this.redisClient.get(redisKey);

    // if (!data) {
    //   // socket seat return not yet
    //   this.gateway.server.to(`schedule-${scheduleId}`).emit('seat_cancel_hold_update', {
    //     seatIds: requestSeatIds,
    //     schedule_id: scheduleId,
    //     status: StatusSeat.NOT_YET,
    //   });
    //   throw new BadRequestException('Your seat hold has expired. Please select seats again.');
    // }

    const keys = await this.redisClient.keys(`seat-hold-${scheduleId}-*`);

    if (!keys.length) return;

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
        throw new ConflictException('Some seats are already held by another user. Please try again later.');
      }
    }

    // Xóa Redis key của người dùng hiện tại sau khi đặt đơn thành công
    await this.redisClient.del(redisKey);
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



  async getAllOrders() {
    const orders = await this.orderRepository.find({
      relations: ['user',
        'promotion',
        'transaction',
        'transaction.paymentMethod',
        'orderDetails',
        'orderDetails.ticket',
        'orderDetails.schedule',
        'orderDetails.schedule.movie',
        'orderDetails.ticket',
        'orderDetails.ticket.seat',
        'orderDetails.ticket.ticketType'],
    });

    const bookingSummaries = orders.map(order => this.mapToBookingSummaryLite(order));
    return bookingSummaries;
  }

  async getOrderByIdEmployeeAndAdmin(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user',
        'promotion',
        'transaction',
        'transaction.paymentMethod',
        'orderDetails',
        'orderDetails.ticket',
        'orderDetails.schedule',
        'orderDetails.schedule.movie',
        'orderDetails.ticket.seat',
        'orderDetails.ticket.ticketType'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    return this.mapToBookingSummaryLite(order);
  }
  async getMyOrders(userId: string) {
    const orderByUser = await this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['user',
        'promotion', 'transaction',
        'transaction.paymentMethod',
        'orderDetails', 'orderDetails.ticket',
        'orderDetails.schedule',
        'orderDetails.schedule.movie',
        'orderDetails.ticket.seat',
        'orderDetails.ticket.ticketType'],
    });

    const bookingSummaries = orderByUser.map(order => this.mapToBookingSummaryLite(order));
    return bookingSummaries;
  }

  private mapToBookingSummaryLite(order: Order) {
    return {
      id: order.id,
      order_date: order.order_date,
      total_prices: order.total_prices,
      status: order.status,
      user: {
        id: order.user.id,
        username: order.user.username,
        email: order.user.email,
      },
      promotion: {
        title: order.promotion?.title
      },
      orderDetails: order.orderDetails.map(detail => ({
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
        start_movie_time: detail.schedule.start_movie_time,
        end_movie_time: detail.schedule.end_movie_time,

        movie: {
          id: detail.schedule.movie.id,
          name: detail.schedule.movie.name,
        },
      })),
      transaction: {
        transaction_code: order.transaction.transaction_code,
        status: order.transaction.status,
        PaymentMethod: {
          method_name: order.transaction.paymentMethod.name
        }
      },
    };
  }
  async scanQrCode(qrCode: string) {
    if (!process.env.JWT_QR_CODE_SECRET) {
      throw new ForbiddenException('JWT QR Code secret is not set');
    }
    try {
      const decoded = jwt.verify(qrCode, process.env.JWT_QR_CODE_SECRET) as { orderId: number };
      //get Order from decoded
      const order = await this.getOrderByIdEmployeeAndAdmin(decoded.orderId);
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      return order;
    } catch (error) {
      throw new ForbiddenException('Invalid QR code');
    }
  }

}
