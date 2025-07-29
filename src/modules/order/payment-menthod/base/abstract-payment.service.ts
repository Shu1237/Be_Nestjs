import { MailerService } from '@nestjs-modules/mailer';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Method } from 'src/common/enums/payment-menthod.enum';
import { PaymentGateway } from 'src/common/enums/payment_gatewat.enum';
import { Role } from 'src/common/enums/roles.enum';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { StatusSeat } from 'src/common/enums/status_seat.enum';
import { InternalServerErrorException } from 'src/common/exceptions/internal-server-error.exception';
import { MyGateWay } from 'src/common/gateways/seat.gateway';
import { QrCodeService } from 'src/common/qrcode/qrcode.service';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { HistoryScore } from 'src/database/entities/order/history_score';
import { Order } from 'src/database/entities/order/order';
import { OrderExtra } from 'src/database/entities/order/order-extra';
import { Ticket } from 'src/database/entities/order/ticket';
import { Transaction } from 'src/database/entities/order/transaction';
import { User } from 'src/database/entities/user/user';
import { In, Repository } from 'typeorm';

export abstract class AbstractPaymentService {
  constructor(
    protected readonly transactionRepository: Repository<Transaction>,
    protected readonly orderRepository: Repository<Order>,
    protected readonly ticketRepository: Repository<Ticket>,
    protected readonly scheduleSeatRepository: Repository<ScheduleSeat>,
    protected readonly historyScoreRepository: Repository<HistoryScore>,
    protected readonly userRepository: Repository<User>,
    protected readonly orderExtraRepository: Repository<OrderExtra>,
    protected readonly mailerService: MailerService,
    protected readonly gateway: MyGateWay,
    protected readonly qrCodeService: QrCodeService,
    protected readonly configService: ConfigService,
    protected readonly jwtService: JwtService,
  ) {}
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

  async changeStatusScheduleSeatToFailed(
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
      seat.status = StatusSeat.NOT_YET;
      await this.scheduleSeatRepository.save(seat);
    }
  }
  async changeStatusScheduleSeatToBooked(
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
  // async createOrderRefundRecord(params: {
  //     order: Order;
  //     transaction: Transaction;
  //     gateway: PaymentGateway;
  //     response: any;
  // }): Promise<OrderRefund> {
  //     const { order, transaction, gateway, response } = params;

  //     const commonData = {
  //         order,
  //         payment_gateway: gateway,
  //         order_ref_id: `refund_${Date.now()}`,
  //         refund_amount: order.total_prices,
  //         refund_status: RefundStatus.PENDING,
  //         created_at: new Date(),
  //         description: `Refund for order ${order.id} via ${gateway}`,
  //     };

  //     if (gateway === PaymentGateway.MOMO) {
  //         return this.orderRefundRepository.save(
  //             this.orderRefundRepository.create({
  //                 ...commonData,
  //                 transaction_code: response.transId,
  //                 partner_code: this.configService.get<string>('momo.partnerCode'),
  //                 request_id: response.requestId,
  //                 signature: response.signature,
  //                 lang: 'vi',
  //             }),
  //         );
  //     }

  //     if (gateway === PaymentGateway.PAYPAL) {
  //         return this.orderRefundRepository.save(
  //             this.orderRefundRepository.create({
  //                 ...commonData,
  //                 transaction_code: transaction.transaction_code,
  //                 currency_code: 'USD',
  //                 request_id: response?.purchase_units?.[0]?.payments?.captures?.[0]?.id || transaction.transaction_code,
  //             }),
  //         );
  //     }

  //     if (gateway === PaymentGateway.VISA) {
  //         // Handle both old format (sessionId|paymentIntentId) and new format (sessionId only)
  //         const transactionCode = transaction.transaction_code;
  //         const paymentIntentId = response?.payment_intent || null;

  //         const refundData = {
  //             ...commonData,
  //             transaction_code: transactionCode,
  //             currency_code: 'USD',
  //             request_id: paymentIntentId || transactionCode,
  //             order_ref_id: transactionCode, // sessionId for retrieving session later
  //         };

  //         // Only include payment_intent_id if it exists and is not null
  //         if (paymentIntentId) {
  //             (refundData as any).payment_intent_id = paymentIntentId;
  //         }

  //         return this.orderRefundRepository.save(
  //             this.orderRefundRepository.create(refundData),
  //         );
  //     }

  //     throw new Error('Unsupported gateway for refund record');
  // }

  async handleReturnSuccess(
    transaction: Transaction,
    rawResponse?: any,
  ): Promise<string> {
    const order = transaction.order;
    transaction.status = StatusOrder.SUCCESS;
    order.status = StatusOrder.SUCCESS;

    await this.transactionRepository.save(transaction);
    // const paymentMethodId = transaction.paymentMethod.id;
    // let gateway: PaymentGateway | null = null;

    // switch (paymentMethodId) {
    //     case Method.MOMO:
    //         gateway = PaymentGateway.MOMO;
    //         break;
    //     case Method.PAYPAL:
    //         gateway = PaymentGateway.PAYPAL;
    //         break;
    //     case Method.VISA:
    //         gateway = PaymentGateway.VISA;
    //         break;
    // }

    // if (gateway) {
    //     await this.createOrderRefundRecord({
    //         order,
    //         transaction,
    //         gateway,
    //         response: rawResponse,
    //     });
    // }

    const endScheduleTime =
      order.orderDetails[0].ticket.schedule.end_movie_time;
    const endTime = new Date(endScheduleTime).getTime();
    const now = Date.now();
    const expiresInSeconds = Math.floor((endTime - now) / 1000);
    const validExpiresIn = expiresInSeconds > 0 ? expiresInSeconds : 60 * 60;

    const jwtOrderID = this.jwtService.sign(
      { orderId: order.id },
      {
        secret: this.configService.get<string>('jwt.qrSecret'),
        expiresIn: validExpiresIn,
      },
    );

    const qrCode = await this.qrCodeService.generateQrCode(jwtOrderID, 'QR');
    order.qr_code = qrCode;
    const savedOrder = await this.orderRepository.save(order);

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
        created_at: new Date(),
      });
    }

    for (const detail of order.orderDetails) {
      const ticket = detail.ticket;
      if (ticket) {
        ticket.status = true;
        await this.ticketRepository.save(ticket);
      }
    }

    // Change seat status from HELD to BOOKED when payment is successful
    const seatIds = order.orderDetails.map((detail) => detail.ticket.seat.id);
    const scheduleId = order.orderDetails[0].ticket.schedule.id;
    await this.changeStatusScheduleSeatToBooked(seatIds, scheduleId);

    if (order.orderExtras && order.orderExtras.length > 0) {
      for (const extra of order.orderExtras) {
        extra.status = StatusOrder.SUCCESS;
        await this.orderExtraRepository.save(extra);
      }
    }

    try {
      await this.sendOrderConfirmationEmail(order, transaction);
    } catch (error) {
      // console.error('Mailer error:', error);
      throw new NotFoundException('Failed to send confirmation email');
    }

    this.gateway.emitBookSeat({
      schedule_id: order.orderDetails[0].ticket.schedule.id,
      seatIds: order.orderDetails.map((detail) => detail.ticket.seat.id),
    });

    return `${this.configService.get<string>('redirectFE.url')}?status=success&orderId=${savedOrder.id}&total=${savedOrder.total_prices}&paymentMethod=${transaction.paymentMethod.name}`;
  }
  async handleReturnFailed(transaction: Transaction): Promise<string> {
    // const order = transaction.order;

    // // Change seat status from HELD to NOT_YET when payment fails
    // for (const detail of order.orderDetails) {
    //     const ticket = detail.ticket;
    //     if (ticket?.seat && ticket.schedule) {
    //         await this.changeStatusScheduleSeatToFailed([ticket.seat.id], ticket.schedule.id);
    //     }
    // }

    // // Update order extras status to FAILED
    // if (order.orderExtras && order.orderExtras.length > 0) {
    //     for (const extra of order.orderExtras) {
    //         extra.status = StatusOrder.FAILED;
    //         await this.orderExtraRepository.save(extra);
    //     }
    // }

    // // Notify via socket that seats are cancelled
    // this.gateway.onCancelBookSeat({
    //     schedule_id: order.orderDetails[0].ticket.schedule.id,
    //     seatIds: order.orderDetails.map(detail => detail.ticket.seat.id),
    // });

    return `${this.configService.get<string>('redirectFE.url')}?status=failed`;
  }

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
        start_movie_time: firstTicket?.schedule.start_movie_time ?? '',
        end_movie_time: firstTicket?.schedule.end_movie_time ?? '',
        seats: order.orderDetails.map((detail) => ({
          row: detail.ticket.seat.seat_row,
          column: detail.ticket.seat.seat_column,
          ticketType: detail.ticket.ticketType.ticket_name,
          price: Number(detail.total_each_ticket).toLocaleString('vi-VN'),
        })),
        orderExtras:
          order.orderExtras?.map((extra) => ({
            name: extra.product.name,
            quantity: extra.quantity,
            price: Number(extra.unit_price).toLocaleString('vi-VN'),
            total: (extra.quantity * Number(extra.unit_price)).toLocaleString(
              'vi-VN',
            ),
          })) || [],
      },
    });
  }
}
