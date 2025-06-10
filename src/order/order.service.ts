import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
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
import { SeatService } from 'src/seat/seat.service';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Seat } from 'src/typeorm/entities/cinema/seat';



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
    @InjectRepository(Seat)
    private seatRepository: Repository<Seat>,

    private readonly momoService: MomoService,
    private readonly paypalService: PayPalService,
    private readonly visaService: VisaService,
    private readonly vnpayService: VnpayService,
    private readonly zalopayService: ZalopayService,
    private readonly seatService: SeatService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,


  ) { }

  async getUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId }
      , relations: ['member', 'role']
    }
    );
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }


  async getPromotionById(promotionId: number) {
    const promotion = await this.promotionRepository.findOne({
      where: { id: promotionId },
    });
    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${promotionId} not found`);
    }
    return promotion;
  }

  async getScheduleById(scheduleId: number) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }
    return schedule;
  }
  async getOrderById(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['transaction']
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    return order;
  }
  async getTransactionById(transactionId: number) {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['order', 'paymentMethod'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }
    return transaction;
  }

  async getTicketTypeByAudienceType(audienceType: string) {
    const ticketType = await this.ticketTypeRepository.findOne({
      where: { audience_type: audienceType },
    });
    if (!ticketType) {
      throw new NotFoundException(`Ticket type not found for audience: ${audienceType}`);
    }
    return ticketType;
  }

  async createOrder(userData: JWTUserType, orderBill: OrderBillType, clientIp: string) {
    try {
      const user = await this.getUserById(userData.account_id);
      // console.log('User:', user.id);

      const [promotion, schedule] = await Promise.all([
        this.getPromotionById(orderBill.promotion_id),
        this.getScheduleById(orderBill.schedule_id),
      ]);

      // Fetch seat IDs
      const seatIds = orderBill.seats.map((seat: SeatInfo) => seat.id);

      // Lấy scheduleSeats ban đầu để kiểm tra
      let scheduleSeats = await this.scheduleSeatRepository.find({
        where: {
          seat: { id: In(seatIds) },
          schedule: { id: schedule.id },
        },
        relations: ['seat', 'seat.seatType'],
      });

      // Kiểm tra ghế đã booked
      const bookedSeats = scheduleSeats.filter((seat) => seat.status === StatusSeat.BOOKED);
      if (bookedSeats.length > 0) {
        throw new BadRequestException(
          `Some seats are already booked: ${bookedSeats.map(s => s.seat.id).join(', ')}`,
        );
      }

      // Kiểm tra cache và hủy hold seats nếu cần
      // console.log('Checking cache for key:', cacheKey);
      const cacheHoldSeats = await this.cacheManager.get<HoldSeatType>(`seat-hold-${user.id}`);
      console.log('Cache result:', cacheHoldSeats);

      if (cacheHoldSeats?.schedule_id === schedule.id && cacheHoldSeats?.seatIds?.length > 0) {
        // console.log('Cancelling hold seats...');
        await this.seatService.cancelHoldSeat(
          {
            seatIds: cacheHoldSeats.seatIds,
            schedule_id: cacheHoldSeats.schedule_id,
          },
          {
            account_id: user.id,
            username: user.username,
            role_id: user.role.role_id
          },
        );
        // console.log('Hold seats cancelled');

        // Lấy lại scheduleSeats để phản ánh trạng thái mới
        scheduleSeats = await this.scheduleSeatRepository.find({
          where: {
            seat: { id: In(seatIds) },
            schedule: { id: schedule.id },
          },
          relations: ['seat', 'seat.seatType'],
        });
      }

      // Kiểm tra unavailable seats SAU KHI cancelHoldSeat
      const unavailableSeats = scheduleSeats.filter(
        seat => seat.status === StatusSeat.BOOKED || seat.status === StatusSeat.HELD,
      );
      if (unavailableSeats.length > 0) {
        throw new BadRequestException(
          `Seats ${unavailableSeats.map(s => s.seat.id).join(', ')} are already booked or held.`,
        );
      }

      // Tính toán giá vé
      let discount = promotion.discount;
      let totalPrice = 0;

      const ticketPrices = await Promise.all(
        orderBill.seats.map(async seatData => {
          const seat = scheduleSeats.find(s => s.seat.id === seatData.id);
          if (!seat) {
            throw new NotFoundException(`Seat with ID ${seatData.id} not found`);
          }
          const ticketType = await this.getTicketTypeByAudienceType(seatData.audience_type);
          const seatPrice = parseFloat(seat.seat.seatType.seat_type_price as any);
          const audienceDiscount = parseFloat(ticketType.discount as any);
          return seatPrice * (1 - audienceDiscount / 100);
        }),
      );

      const subTotal = ticketPrices.reduce((sum, price) => sum + price, 0);
      // console.log('SubTotal:', subTotal);
      if (Number(discount) === 0) {
        totalPrice = subTotal;
      } else {
        const promotionDiscount = parseFloat(discount as any);
        totalPrice = subTotal * (1 - promotionDiscount / 100);
      }

      const inputTotal = parseFloat(orderBill.total_prices);
      if (Math.abs(totalPrice - inputTotal) > 0.01) {
        throw new BadRequestException('Total price mismatch. Please refresh and try again.');
      }

      const orderScore = Math.floor(Number(orderBill.total_prices) / 1000);

      // Tạo transaction
      const paymentMethod = await this.paymentMethodRepository.findOne({
        where: { id: Number(orderBill.payment_method_id) },
      });
      if (!paymentMethod) {
        throw new NotFoundException(`Payment method ${orderBill.payment_method_id} not found`);
      }

      let paymentCode: any;
      switch (Number(orderBill.payment_method_id)) {
        case Method.MOMO:
          paymentCode = await this.momoService.createOrderMomo(orderBill.total_prices);
          break;
        case Method.PAYPAL:
          paymentCode = await this.paypalService.createOrderPaypal(orderBill);
          break;
        case Method.VISA:
          paymentCode = await this.visaService.createOrderVisa(orderBill);
          break;
        case Method.VNPAY:
          paymentCode = await this.vnpayService.createOrderVnPay(orderBill, clientIp);
          break;
        case Method.ZALOPAY:
          paymentCode = await this.zalopayService.createOrderZaloPay(orderBill);
          break;
        default:
          paymentCode = {
            payUrl: 'Payment successful by Cash',
            orderId: 'CASH_ORDER_' + new Date().getTime(),
          };
      }

      if (!paymentCode || !paymentCode.payUrl || !paymentCode.orderId) {
        throw new BadRequestException('Payment method failed to create order');
      }
      // Create order
      const newOrder = await this.orderRepository.save({
        booking_date: orderBill.booking_date,
        add_score: orderScore,
        total_prices: orderBill.total_prices,
        status: Number(orderBill.payment_method_id) === Method.CASH ? 'success' : 'pending',
        user,
        promotion,
      });

      const transaction = await this.transactionRepository.save({
        transaction_code: paymentCode.orderId,
        transaction_date: new Date(),
        prices: orderBill.total_prices,
        status: Number(orderBill.payment_method_id) === Method.CASH ? 'success' : 'pending',
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
      for (const seatData of orderBill.seats) {
        const seat = scheduleSeats.find(s => s.seat.id === seatData.id);
        if (!seat) {
          throw new NotFoundException(`Seat with ID ${seatData.id} not found`);
        }
        seat.status = StatusSeat.BOOKED;
        await this.scheduleSeatRepository.save(seat);

        // create ticket 
        const ticketType = await this.getTicketTypeByAudienceType(seatData.audience_type);
        const newTicket = await this.ticketRepository.save({
          seat: seat.seat,
          schedule: schedule,
          ticketType: ticketType,
          status: Number(orderBill.payment_method_id) === Method.CASH ? true : false,
        });

        // create order detail
        // Calculate ticket price
        const seatPrice = parseFloat(seat.seat.seatType.seat_type_price as any);
        const discount = parseFloat(ticketType.discount as any);
        const finalPrice = seatPrice * (1 - discount / 100);

        // Create order detail
        await this.orderDetailRepository.save({
          total_each_ticket: finalPrice.toString(),
          order: newOrder,
          ticket: newTicket,
          schedule: schedule,

        });
      }



      return { payUrl: paymentCode.payUrl };
    } catch (error) {
      throw error;
    }
  }



  async getAllOrders() {
    const orders = await this.orderRepository.find({
      relations: ['user', 'promotion', 'transaction', 'transaction.paymentMethod', 'orderDetails', 'orderDetails.ticket', 'orderDetails.schedule', 'orderDetails.schedule.movie', 'orderDetails.ticket', 'orderDetails.ticket.seat', 'orderDetails.ticket.ticketType'],
    });

    const bookingSummaries = orders.map(order => this.mapToBookingSummaryLite(order));
    return bookingSummaries;
  }

  async getOrderByIdEmployeeAndAdmin(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'promotion', 'transaction', 'transaction.paymentMethod', 'orderDetails', 'orderDetails.ticket', 'orderDetails.schedule', 'orderDetails.schedule.movie', 'orderDetails.ticket.seat', 'orderDetails.ticket.ticketType'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    return this.mapToBookingSummaryLite(order);
  }
  async getMyOrders(userId: string) {
    const orderByUser = await this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'promotion', 'transaction', 'transaction.paymentMethod', 'orderDetails', 'orderDetails.ticket', 'orderDetails.schedule', 'orderDetails.schedule.movie', 'orderDetails.ticket.seat', 'orderDetails.ticket.ticketType'],
    });

    const bookingSummaries = orderByUser.map(order => this.mapToBookingSummaryLite(order));
    return bookingSummaries;
  }

  private mapToBookingSummaryLite(order: Order) {
    return {
      id: order.id,
      booking_date: order.booking_date,
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
        seat: {
          id: detail.ticket.seat.id,
          seat_row: detail.ticket.seat.seat_row,
          seat_column: detail.ticket.seat.seat_column,
        },
        ticketType: {
          ticket_name: detail.ticket.ticketType.ticket_name,
        },
        show_date: detail.schedule.show_date,
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
}
