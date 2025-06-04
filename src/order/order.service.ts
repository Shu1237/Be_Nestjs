import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Order } from 'src/typeorm/entities/order/order';
import { OrderDetail } from 'src/typeorm/entities/order/order-detail';
import { PaymentMethod } from 'src/typeorm/entities/order/payment-method';
import { Transaction } from 'src/typeorm/entities/order/transaction';
import { v4 as uuidv4 } from 'uuid';
import { JWTUserType, OrderBill } from 'src/utils/type';
import { User } from 'src/typeorm/entities/user/user';
import { Seat } from 'src/typeorm/entities/cinema/seat';
import { SeatType } from 'src/typeorm/entities/cinema/seat-type';
import { Promotion } from 'src/typeorm/entities/promotion/promotion';
import { Schedule } from 'src/typeorm/entities/cinema/schedule';
import { Ticket } from 'src/typeorm/entities/order/ticket';
import { TicketType } from 'src/typeorm/entities/order/ticket-type';
import { MomoService } from './payment-menthod/momo/momo.service';


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
    @InjectRepository(Seat)
    private seatRepository: Repository<Seat>,
    @InjectRepository(SeatType)
    private seatTypeRepository: Repository<SeatType>,
    @InjectRepository(Promotion)
    private promotionRepository: Repository<Promotion>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketType)
    private ticketTypeRepository: Repository<TicketType>,
    private readonly momoService: MomoService,
  ) { }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async getSeatById(seatId: string): Promise<Seat> {
    const seat = await this.seatRepository.findOne({
      where: { id: seatId },
      relations: ['seatType', 'cinemaRoom'],
    });
    if (!seat) {
      throw new NotFoundException(`Seat with ID ${seatId} not found`);
    }
    return seat;
  }

  async getPromotionById(promotionId: number): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({
      where: { id: promotionId },
    });
    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${promotionId} not found`);
    }
    return promotion;
  }

  async getScheduleById(scheduleId: number): Promise<Schedule> {
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
      relations:['transaction']
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    return order;
  }
  async getTransactionById(transactionId: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['order', 'paymentMethod'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }
    return transaction;
  }

  async getTicketTypeByAudienceType(audienceType: string): Promise<TicketType> {
    const ticketType = await this.ticketTypeRepository.findOne({
      where: { audience_type: audienceType },
    });
    if (!ticketType) {
      throw new NotFoundException(`Ticket type not found for audience: ${audienceType}`);
    }
    return ticketType;
  }

  async createOrder(userData: JWTUserType) {
    try {
      // Get user
      const user = await this.getUserById('e18f46c3-77ba-4eec-9b89-e0237710f2b1')

      // Mock order data (consider moving to DTO)
      const orderBill: OrderBill = {
        payment_method: 'momo',
        status: 'pending',
        booking_date: new Date(),
        add_score: 100,
        use_score: 0,
        total_prices: "20000",
        user,
        promotion: 1,
        schedule_id: 1,
        seats: [
          { id: 'A1', seat_row: 'A', seat_column: '1', audience_type: 'adult' },
          { id: 'A2', seat_row: 'A', seat_column: '2', audience_type: 'student' },
          { id: 'A3', seat_row: 'A', seat_column: '3', audience_type: 'student' },
        ],
      };

      // Validate promotion and schedule
      const [promotion, schedule] = await Promise.all([
        this.getPromotionById(orderBill.promotion),
        this.getScheduleById(orderBill.schedule_id),
      ]);

      // Fetch and validate seats
      const seatIds = orderBill.seats.map(seat => seat.id);
      const seats = await this.seatRepository.find({
        where: { id: In(seatIds) },
        relations: ['seatType'],
      });

      if (seats.length !== seatIds.length) {
        throw new NotFoundException('Some seats were not found');
      }

      const unavailableSeats = seats.filter(seat => !seat.status);
      if (unavailableSeats.length > 0) {
        throw new BadRequestException(`Seats ${unavailableSeats.map(s => s.id).join(', ')} are already booked`);
      }

      // Calculate total price (consider moving to a separate method)
      let totalPrice = 0;
      const ticketPrices = await Promise.all(
        orderBill.seats.map(async seatData => {
          const seat = seats.find(s => s.id === seatData.id);
          const ticketType = await this.getTicketTypeByAudienceType(seatData.audience_type);
          const seatPrice = parseFloat(seat?.seatType.seat_type_price as any);
          const discount = parseFloat(ticketType.discount as any);
          return seatPrice * (1 - discount / 100);
        })
      );
      // totalPrice = ticketPrices.reduce((sum, price) => sum + price, 0);

      // Create order
      const newOrder = await this.orderRepository.save({
        booking_date: orderBill.booking_date,
        add_score: orderBill.add_score,
        use_score: orderBill.use_score,
        total_prices: orderBill.total_prices,
        status: orderBill.status,
        user,
        promotion,
      });

      // Create Momo payment
      const paymentCode = await this.momoService.createPayment(orderBill.total_prices);
      if (!paymentCode || !paymentCode.payUrl) {
        throw new BadRequestException('Failed to create Momo payment');
      }

      // Create transaction
      const paymentMethod = await this.paymentMethodRepository.findOne({
        where: { name: orderBill.payment_method.toLowerCase() },
      });
      if (!paymentMethod) {
        throw new NotFoundException(`Payment method ${orderBill.payment_method} not found`);
      }

      const transaction = await this.transactionRepository.save({
        transaction_code: paymentCode.orderId,
        transaction_date: new Date(),
        prices: orderBill.total_prices,
        status: 'pending',
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
        const seat = seats.find(s => s.id === seatData.id);
        const ticketType = await this.getTicketTypeByAudienceType(seatData.audience_type);

        // Create ticket
        const newTicket = await this.ticketRepository.save({
          status: true,
          schedule,
          seat,
          ticketType,
        });

        // Update seat status
        await this.seatRepository.update(seatData.id, { status: false });

        // Calculate ticket price
        const seatPrice = parseFloat(seat?.seatType.seat_type_price as any);
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
}



