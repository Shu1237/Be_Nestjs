import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as qs from 'qs';
import * as moment from 'moment';
import { OrderBillType } from 'src/utils/type';
import { InjectRepository } from '@nestjs/typeorm';
import { Seat } from 'src/typeorm/entities/cinema/seat';
import { Order } from 'src/typeorm/entities/order/order';
import { Ticket } from 'src/typeorm/entities/order/ticket';
import { Member } from 'src/typeorm/entities/user/member';
import { Repository } from 'typeorm';
import { Transaction } from 'src/typeorm/entities/order/transaction';

@Injectable()
export class VnpayService {
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

  async getTransactionByOrderId(orderId: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { transaction_code: orderId },
      relations: [
        'order',
        'order.orderDetails',
        'order.orderDetails.ticket',
        'order.orderDetails.ticket.seat',
        'order.user',
        'order.user.member',
      ],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
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
        const transaction = await this.getTransactionByOrderId(txnRef);
        transaction.status = 'success';
        await this.transactionRepository.save(transaction);

        if (!transaction.order) throw new NotFoundException('Order not found');
        transaction.order.status = 'success';
        await this.orderRepository.save(transaction.order);

        const order = transaction.order;
        order.user.member.score += order.add_score;
        await this.memberRepository.save(order.user.member);

        for (const detail of order.orderDetails) {
          const ticket = detail.ticket;
          if (ticket) {
            ticket.status = true;
            await this.ticketRepository.save(ticket);
          }
        }

        return { success: true, message: 'Payment successful' };
      } else {
        const transaction = await this.getTransactionByOrderId(txnRef);
        transaction.status = 'failed';
        await this.transactionRepository.save(transaction);
        if (!transaction.order) throw new NotFoundException('Order not found');
        transaction.order.status = 'failed';
        await this.orderRepository.save(transaction.order);
        for (const detail of transaction.order.orderDetails) {
          const ticket = detail.ticket;
          if (ticket) {
            if (ticket.seat) {
              ticket.seat.status = false;
              await this.seatRepository.save(ticket.seat);
            }
          }
        }
        return { success: false, message: 'Payment failed from VNPAY' };
      }
    } else {
      return { success: false, message: 'Invalid signature from VNPAY' };
    }
  }
}
