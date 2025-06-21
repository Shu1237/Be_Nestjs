import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Transaction } from 'src/typeorm/entities/order/transaction';
import { Order } from 'src/typeorm/entities/order/order';
import { Ticket } from 'src/typeorm/entities/order/ticket';
import { MailerService } from '@nestjs-modules/mailer';
import { ScheduleSeat, SeatStatus } from 'src/typeorm/entities/cinema/schedule_seat';
import { Role } from 'src/enum/roles.enum';
import { StatusOrder } from 'src/enum/status-order.enum';
import { HistoryScore } from 'src/typeorm/entities/order/history_score';
import { User } from 'src/typeorm/entities/user/user';
import { OrderExtra } from 'src/typeorm/entities/order/order-extra';
import { MyGateWay } from 'src/gateways/seat.gateway';
import { QrCodeService } from 'src/qrcode/qrcode.service';
import * as jwt from 'jsonwebtoken';
@Injectable()
export class MomoService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(ScheduleSeat)
    private readonly scheduleSeatRepository: Repository<ScheduleSeat>,
    @InjectRepository(HistoryScore)
    private readonly historyScoreRepository: Repository<HistoryScore>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OrderExtra)
    private readonly orderExtraRepository: Repository<OrderExtra>,
    private mailerService: MailerService,

    private readonly gateway: MyGateWay,
    private readonly qrCodeService: QrCodeService,
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

        'paymentMethod',
        'order',


        'order.user',
        'order.user.role',
        'order.promotion',
        'order.orderExtras',
        'order.orderExtras.product',


        'order.orderDetails',


        'order.orderDetails.schedule',
        'order.orderDetails.ticket',

        'order.orderDetails.ticket.ticketType',
        'order.orderDetails.ticket.seat',
        'order.orderDetails.ticket.schedule',
        'order.orderDetails.ticket.schedule.movie',
        'order.orderDetails.ticket.schedule.cinemaRoom',
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
    if (transaction.status !== StatusOrder.PENDING) {
      throw new NotFoundException('Transaction is not in pending state');
    }
    if (Number(resultCode) === 0) {
      // Giao dịch thành công
      return this.handleReturnSuccess(transaction);
    } else {
      // Giao dịch thất bại
      return this.handleReturnFailed(transaction);
    }

  }

  //handle return success 
  async handleReturnSuccess(transaction: Transaction) {
    const order = transaction.order;
    // Giao dịch thành công
    transaction.status = StatusOrder.SUCCESS;
    order.status = StatusOrder.SUCCESS;

    await this.transactionRepository.save(transaction);
    const savedOrder = await this.orderRepository.save(order);

    // generate QR code , jwt orderid
    const endScheduleTime = order.orderDetails[0].ticket.schedule.end_movie_time;
    if (!process.env.JWT_QR_CODE_SECRET) {
      throw new ForbiddenException('JWT QR Code secret is not set');
    }
    const endTime = new Date(endScheduleTime).getTime();
    const now = Date.now();
    const expiresInSeconds = Math.floor((endTime - now) / 1000);

    const jwtOrderID = jwt.sign(
      { orderId: savedOrder.id },
      process.env.JWT_QR_CODE_SECRET,
      {
        expiresIn: expiresInSeconds > 0 ? expiresInSeconds : 60 * 60,
      }
    );
    const qrCode = await this.qrCodeService.generateQrCode(jwtOrderID);

    // Cộng điểm cho người dùng
    if (order.user?.role.role_id === Role.USER) {
      const orderScore = Math.floor(Number(order.total_prices) / 1000);
      const addScore = orderScore - (order.promotion?.exchange ?? 0);
      order.user.score += addScore;
      await this.userRepository.save(order.user);
      // history score
      await this.historyScoreRepository.save({
        score_change: addScore,
        user: order.user,
        order: savedOrder,
      });
    }

    // Đánh dấu ticket đã sử dụng
    for (const detail of order.orderDetails) {
      const ticket = detail.ticket;
      if (ticket) {
        ticket.status = true;
        await this.ticketRepository.save(ticket);
      }
    }
    if (order.orderExtras && order.orderExtras.length > 0) {
      for (const extra of order.orderExtras) {
        extra.status = StatusOrder.SUCCESS;
        await this.orderExtraRepository.save(extra);
      }
    }
    // Gửi email xác nhận
    try {
      await this.sendOrderConfirmationEmail(order, transaction);
    } catch (error) {
      console.error('Mailer error:', error);
      throw new NotFoundException('Failed to send confirmation email');
    }

    this.gateway.onBookSeat({
      schedule_id: order.orderDetails[0].ticket.schedule.id,
      seatIds: order.orderDetails.map(detail => detail.ticket.seat.id),

    })
    return {
      message: 'Payment successful',
      order: savedOrder,
      qrCode
    };



  }
  //handle return failed
  async handleReturnFailed(transaction: Transaction) {
    const order = transaction.order;
    // Reset trạng thái ghế nếu cần
    for (const detail of order.orderDetails) {
      const ticket = detail.ticket;
      if (ticket?.seat && ticket.schedule) {
        await this.changeStatusScheduleSeat([ticket.seat.id], ticket.schedule.id);
      }
    }
    if (order.orderExtras && order.orderExtras.length > 0) {
      for (const extra of order.orderExtras) {
        extra.status = StatusOrder.FAILED;
        await this.orderExtraRepository.save(extra);
      }
    }
    // socket return seat not yet 
    this.gateway.onCancelBookSeat({
      schedule_id: order.orderDetails[0].ticket.schedule.id,
      seatIds: order.orderDetails.map(detail => detail.ticket.seat.id),
    });

    return { message: 'Payment failed' };
  }



 // send email order confirm
  async sendOrderConfirmationEmail(order: Order, transaction: Transaction) {
  const firstTicket = order.orderDetails[0]?.ticket;
  await this.mailerService.sendMail({
    to: order.user.email,
    subject: 'Your Order Successful',
    template: 'order-confirmation',
    context: {
      user: order.user.username,
      transactionCode: transaction.transaction_code,
      order_date: order.order_date,
      total: Number(order.total_prices).toLocaleString('vi-VN'),
      paymentMethod: transaction.paymentMethod.name,
      year: new Date().getFullYear(),
      movieName: firstTicket?.schedule.movie.name,
      roomName: firstTicket?.schedule.cinemaRoom.cinema_room_name,
      start_movie_time: firstTicket?.schedule.start_movie_time,
      end_movie_time: firstTicket?.schedule.end_movie_time,
      seats: order.orderDetails.map(detail => ({
        row: detail.ticket.seat.seat_row,
        column: detail.ticket.seat.seat_column,
        ticketType: detail.ticket.ticketType.ticket_name,
        price: Number(detail.total_each_ticket).toLocaleString('vi-VN'),
      })),
      orderExtras: order.orderExtras?.map(extra => ({
        name: extra.product.name,
        quantity: extra.quantity,
        price: Number(extra.unit_price).toLocaleString('vi-VN'),
        total: (extra.quantity * Number(extra.unit_price)).toLocaleString('vi-VN'),
      })) || [],
    },
  });
}

}
