import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as qs from 'qs';
import * as moment from 'moment';
import { OrderBillType } from 'src/utils/type';
import { InjectRepository } from '@nestjs/typeorm';
import { Seat } from 'src/typeorm/entities/cinema/seat';
import { Order } from 'src/typeorm/entities/order/order';
import { Ticket } from 'src/typeorm/entities/order/ticket';
import { Repository } from 'typeorm';
import { Transaction } from 'src/typeorm/entities/order/transaction';
import { MomoService } from '../momo/momo.service';
import { Role } from 'src/enum/roles.enum';
import { StatusOrder } from 'src/enum/status-order.enum';
import { HistoryScore } from 'src/typeorm/entities/order/history_score';
import { User } from 'src/typeorm/entities/user/user';
import { MyGateWay } from 'src/gateways/seat.gateway';
import { OrderExtra } from 'src/typeorm/entities/order/order-extra';
import * as jwt from 'jsonwebtoken';
import { QrCodeService } from 'src/qrcode/qrcode.service';

@Injectable()
export class VnpayService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(OrderExtra)
    private readonly orderExtraRepository: Repository<OrderExtra>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(HistoryScore)
    private readonly historyScoreRepository: Repository<HistoryScore>,

    private momoService: MomoService,
    private gateway: MyGateWay,
    private readonly qrCodeService: QrCodeService,
  ) { }

  async createOrderVnPay(orderItem: OrderBillType, clientIp: string) {
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const orderId = moment(date).format('DDHHmmss');

    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
      throw new Error('VNPAY configuration is missing');
    }

    const amount = Number(orderItem.total_prices);
    const vnp_Params: Record<string, string> = {
      vnp_Amount: (amount * 100).toString(),
      vnp_BankCode: 'NCB',
      vnp_Command: 'pay',
      vnp_CreateDate: createDate,
      vnp_CurrCode: 'VND',
      vnp_IpAddr: clientIp,
      vnp_Locale: 'vn',
      vnp_OrderInfo: orderId,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: returnUrl,
      vnp_TmnCode: tmnCode,
      vnp_TxnRef: orderId,
      vnp_Version: '2.1.0',
    };

    // Sắp xếp thủ công theo thứ tự alphabet
    const sortedParams: Record<string, string> = {};
    Object.keys(vnp_Params)
      .sort()
      .forEach((key) => {
        sortedParams[key] = vnp_Params[key];
      });

    // Tạo chữ ký
    const signData = qs.stringify(sortedParams);
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    sortedParams['vnp_SecureHash'] = signed;
    const url = {
      payUrl: `${vnpUrl}?${qs.stringify(sortedParams)}`,
      orderId: orderId,
    };
    return url;
  }



  async handleReturnVnPay(query: any) {
    const receivedParams = { ...query };
    const secureHash = receivedParams['vnp_SecureHash'];

    delete receivedParams['vnp_SecureHash'];
    delete receivedParams['vnp_SecureHashType'];

    // Sắp xếp thủ công A-Z
    const sortedParams: Record<string, string> = {};
    Object.keys(receivedParams)
      .sort()
      .forEach((key) => {
        sortedParams[key] = receivedParams[key];
      });

    const signData = qs.stringify(sortedParams, { encode: false });
    const secretKey = process.env.VNP_HASH_SECRET;
    if (!secretKey) throw new Error('Missing VNP_HASH_SECRET');

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      const responseCode = receivedParams['vnp_ResponseCode'];
      const txnRef = receivedParams['vnp_TxnRef'];

      if (responseCode === '00') {
        const transaction = await this.momoService.getTransactionByOrderId(txnRef);
        if (transaction.status !== StatusOrder.PENDING) {
          throw new NotFoundException('Transaction is not in pending state');
        }
        // Giao dịch thành công
        const order = transaction.order;
        transaction.status = StatusOrder.SUCCESS;
        order.status = StatusOrder.SUCCESS;

        await this.transactionRepository.save(transaction);
        const savedOrder = await this.orderRepository.save(order);

        // generate QR code
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
          await this.momoService.sendOrderConfirmationEmail(order, transaction);
        } catch (error) {
          console.error('Mailer error:', error);
          throw new NotFoundException('Failed to send confirmation email');
        }

        // Gửi thông báo đến client qua WebSocket
        this.gateway.onBookSeat({
          schedule_id: order.orderDetails[0].ticket.schedule.id,
          seatIds: order.orderDetails.map(detail => detail.ticket.seat.id),
        });
        return {
          message: 'Payment successful',
          order: savedOrder,
        };
      } else {
        // Giao dịch thất bại
        const transaction = await this.momoService.getTransactionByOrderId(txnRef);
        const order = transaction.order;
        transaction.status = StatusOrder.FAILED;
        order.status = StatusOrder.FAILED;
        await this.transactionRepository.save(transaction);
        await this.orderRepository.save(order);

        // Reset trạng thái ghế nếu cần
        for (const detail of order.orderDetails) {
          const ticket = detail.ticket;
          if (ticket?.seat && ticket.schedule) {
            await this.momoService.changeStatusScheduleSeat([ticket.seat.id], ticket.schedule.id);
          }
        }
        // socket return seat not yet 
        this.gateway.onCancelBookSeat({
          schedule_id: order.orderDetails[0].ticket.schedule.id,
          seatIds: order.orderDetails.map(detail => detail.ticket.seat.id),
        });

        return { message: 'Payment failed' };
      }
    } else {
      return { success: false, message: 'Invalid signature from VNPAY' };
    }
  }
}
