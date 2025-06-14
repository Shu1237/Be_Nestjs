import {  Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Transaction } from 'src/typeorm/entities/order/transaction';
import { Order } from 'src/typeorm/entities/order/order';
import { Ticket } from 'src/typeorm/entities/order/ticket';
import { Seat } from 'src/typeorm/entities/cinema/seat';
import { Member } from 'src/typeorm/entities/user/member';
import { MailerService } from '@nestjs-modules/mailer';
import { ScheduleSeat, SeatStatus } from 'src/typeorm/entities/cinema/schedule_seat';
import { Role } from 'src/enum/roles.enum';
import { StatusOrder } from 'src/enum/status-order.enum';

@Injectable()
export class MomoService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    @InjectRepository(ScheduleSeat)
    private readonly scheduleSeatRepository: Repository<ScheduleSeat>,

    private mailerService: MailerService,
  ) { }

  async createOrderMomo(total: string) {
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const partnerCode = process.env.MOMO_PARTNER_CODE;

    if (!accessKey || !secretKey || !partnerCode) {
      throw new Error('Momo configuration is missing');
    }

    const requestId = partnerCode + Date.now();
    const orderId = requestId;
    const orderInfo = 'Momo payment';
    const redirectUrl = process.env.MOMO_REDIRECT_URL;
    const ipnUrl = process.env.MOMO_IPN_URL;
    const requestType = 'payWithMethod';
    const extraData = '';
    const autoCapture = true;

    const rawSignature = `accessKey=${accessKey}&amount=${total}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const requestBody = {
      partnerCode,
      partnerName: 'CINEMA',
      storeId: 'MyStore',
      requestId,
      amount: total,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      requestType,
      autoCapture,
      extraData,
      orderGroupId: '',
      signature,
    };

    try {
      const result = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody, {
        headers: { 'Content-Type': 'application/json' },
      });
      return result.data;
    } catch (error: any) {
      console.error('Momo error:', error?.response?.data || error.message);
      return {
        error: 'Failed to create Momo payment',
        detail: error?.response?.data,
      };
    }
  }

  async getTransactionByOrderId(orderId: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { transaction_code: orderId },
      relations: [
        'order',
        'order.orderDetails',
        'order.orderDetails.ticket',
        'order.orderDetails.ticket.ticketType',
        'order.orderDetails.ticket.seat',
        'order.orderDetails.ticket.schedule',
        'order.orderDetails.ticket.schedule.movie',
        'order.orderDetails.ticket.schedule.cinemaRoom',
        'order.user',
        'order.user.member',
        'order.user.role',
        'paymentMethod',
      ],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async changeStatusScheduleSeat(seatIds: string[], scheduleId: number): Promise<void> {
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
      seat.status = SeatStatus.NOT_YET
      await this.scheduleSeatRepository.save(seat);
    }

  }

  async handleReturn(query: any) {
    const { orderId, resultCode } = query;

    const transaction = await this.getTransactionByOrderId(orderId);
    if (transaction.status !==  StatusOrder.PENDING) {
      throw new NotFoundException('Transaction is not in pending state');
    }
    const order = transaction.order;

    if (Number(resultCode) === 0) {
      // Giao dịch thành công
      transaction.status = StatusOrder.SUCCESS;
      order.status = StatusOrder.SUCCESS;

      await this.transactionRepository.save(transaction);
      const savedOrder = await this.orderRepository.save(order);

      // Cộng điểm cho người dùng
      if ((order.user?.member && order.user.role.role_id === Role.USER)) {
        order.user.member.score += order.add_score;
        await this.memberRepository.save(order.user.member);
      }

      // Đánh dấu ticket đã sử dụng
      for (const detail of order.orderDetails) {
        const ticket = detail.ticket;
        if (ticket) {
          ticket.status = true;
          await this.ticketRepository.save(ticket);
        }
      }

      // Gửi email xác nhận
      try {
        const firstTicket = order.orderDetails[0]?.ticket;
        await this.mailerService.sendMail({
          to: order.user.email,
          subject: 'Your Order Successful',
          template: 'order-confirmation',
          context: {
            user: order.user.username,
            transactionCode: transaction.transaction_code,
            bookingDate: order.booking_date,
            total: order.total_prices,
            addScore: order.add_score,
            paymentMethod: transaction.paymentMethod.name,
            year: new Date().getFullYear(),
            movieName: firstTicket?.schedule.movie.name,
            showDate: firstTicket?.schedule.show_date,
            roomName: firstTicket?.schedule.cinemaRoom.cinema_room_name,
            seats: order.orderDetails.map(detail => ({
              row: detail.ticket.seat.seat_row,
              column: detail.ticket.seat.seat_column,
              ticketType: detail.ticket.ticketType.ticket_name,
              price: detail.total_each_ticket,
            })),
          },
        });
      } catch (error) {
        throw new NotFoundException('Failed to send confirmation email');
      }

      return {
        message: 'Payment successful',
        order: savedOrder,
      };
    } else {
      // Giao dịch thất bại
      transaction.status = StatusOrder.FAILED;
      order.status = StatusOrder.FAILED;
      await this.transactionRepository.save(transaction);
      await this.orderRepository.save(order);

      // Reset trạng thái ghế nếu cần
      for (const detail of order.orderDetails) {
        const ticket = detail.ticket;
        if (ticket?.seat && ticket.schedule) {
          await this.changeStatusScheduleSeat([ticket.seat.id], ticket.schedule.id);
        }
      }

      return { message: 'Payment failed' };
    }
  }

}
