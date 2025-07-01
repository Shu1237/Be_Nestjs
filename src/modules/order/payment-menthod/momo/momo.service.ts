import { ForbiddenException, Injectable, NotFoundException, Redirect } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Transaction } from 'src/database/entities/order/transaction';
import { Order } from 'src/database/entities/order/order';
import { Ticket } from 'src/database/entities/order/ticket';
import { MailerService } from '@nestjs-modules/mailer';
import { ScheduleSeat, SeatStatus } from 'src/database/entities/cinema/schedule_seat';
import { Role } from 'src/common/enums/roles.enum';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { HistoryScore } from 'src/database/entities/order/history_score';
import { User } from 'src/database/entities/user/user';
import { OrderExtra } from 'src/database/entities/order/order-extra';
import { MyGateWay } from 'src/common/gateways/seat.gateway';
import { QrCodeService } from 'src/common/qrcode/qrcode.service';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from 'src/common/exceptions/internal-server-error.exception';
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
    private readonly mailerService: MailerService,

    private readonly gateway: MyGateWay,
    private readonly qrCodeService: QrCodeService,
    private readonly configService: ConfigService,
  ) { }

  async createOrderMomo(total: string) {
    const accessKey = this.configService.get<string>('momo.accessKey');
    const secretKey = this.configService.get<string>('momo.secretKey');
    const partnerCode = this.configService.get<string>('momo.partnerCode');

    if (!accessKey || !secretKey || !partnerCode) {
      throw new InternalServerErrorException('Momo configuration is missing');
    }

    const requestId = partnerCode + TimeUtil.now();
    const orderId = requestId;
    const orderInfo = 'Momo payment';
    const redirectUrl = this.configService.get<string>('momo.redirectUrl');
    const ipnUrl = this.configService.get<string>('momo.ipnUrl');
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
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature
    } = query;

    const accessKey = this.configService.get<string>('momo.accessKey');
    const secretKey = this.configService.get<string>('momo.secretKey');
    if (!accessKey || !secretKey) {
      throw new InternalServerErrorException('Momo configuration is missing');
    }


    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const computedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    if (computedSignature !== signature) {
      throw new ForbiddenException('Invalid MoMo signature');
    }
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
  async handleReturnSuccess(transaction: Transaction): Promise<string> {
    const order = transaction.order;
    // Giao dịch thành công
    transaction.status = StatusOrder.SUCCESS;
    order.status = StatusOrder.SUCCESS;

    await this.transactionRepository.save(transaction);


    // generate QR code , jwt orderid
    const endScheduleTime = order.orderDetails[0].ticket.schedule.end_movie_time;
    const endTime = new Date(endScheduleTime).getTime();
    const now = Date.now();
    const expiresInSeconds = Math.floor((endTime - now) / 1000);

    // fallback: 1 tiếng nếu thời gian đã hết hạn
    const validExpiresIn = expiresInSeconds > 0 ? expiresInSeconds : 60 * 60;

    const qrSecret = this.configService.get<string>('jwt.qrSecret');
    if (!qrSecret) {
      throw new ForbiddenException('JWT QR Code secret is not set');
    }

    const jwtOrderID = jwt.sign(
      { orderId: order.id },
      qrSecret,
      {
        expiresIn: validExpiresIn,
      }
    );
    const qrCode = await this.qrCodeService.generateQrCode(jwtOrderID);
    order.qr_code = qrCode;
    const savedOrder = await this.orderRepository.save(order);
    // Cộng điểm cho người dùng

    let scoreTargetUser: User | null = null;


    if (order.customer_id && order.customer_id.trim() !== '') {
      const customer = await this.userRepository.findOne({
        where: { id: order.customer_id },
        relations: ['role'],
      });

      if (customer && customer.role.role_id === Role.USER) {
        scoreTargetUser = customer;
      }
    } else if (order.user?.role.role_id === Role.USER) {
      scoreTargetUser = order.user;
    }

    if (scoreTargetUser) {
      const orderScore = Math.floor(Number(order.total_prices) / 1000);
      const addScore = orderScore - (order.promotion?.exchange ?? 0);
      scoreTargetUser.score += addScore;
      await this.userRepository.save(scoreTargetUser);

      await this.historyScoreRepository.save({
        score_change: addScore,
        user: scoreTargetUser,
        order: savedOrder,
        created_at: new Date() // Save as UTC in database
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

    });
    // return {
    //   message: 'Payment successful',
    //   order: savedOrder,
    //   qrCode
    // };
    return `${this.configService.get<string>('redirectUrls.successUrl')}?orderId=${savedOrder.id}&total=${(savedOrder.total_prices)}&paymentMethod=${transaction.paymentMethod.name}`;
  }
  //handle return failed
  async handleReturnFailed(transaction: Transaction) : Promise<string> {
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

    // return { message: 'Payment failed' };
    return `${this.configService.get<string>('redirectUrls.failureUrl')}`;
  }



  // send email order confirm
  async sendOrderConfirmationEmail(order: Order, transaction: Transaction) {
    const firstTicket = order.orderDetails[0]?.ticket;
    await this.mailerService.sendMail({
      to: order.user.email,
      subject: 'Your Order Successful',
      template: 'order-confirmation',      context: {
        user: order.user.username,
        transactionCode: transaction.transaction_code,
        order_date: TimeUtil.format(order.order_date, 'DD/MM/YYYY HH:mm'),
        total: Number(order.total_prices).toLocaleString('vi-VN'),
        paymentMethod: transaction.paymentMethod.name,year: new Date().getFullYear(),
        movieName: firstTicket?.schedule.movie.name,
        roomName: firstTicket?.schedule.cinemaRoom.cinema_room_name,
        start_movie_time: firstTicket?.schedule.start_movie_time ? TimeUtil.format(firstTicket.schedule.start_movie_time, 'DD/MM/YYYY HH:mm') : '',
        end_movie_time: firstTicket?.schedule.end_movie_time ? TimeUtil.format(firstTicket.schedule.end_movie_time, 'DD/MM/YYYY HH:mm') : '',
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
