import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Transaction } from 'src/typeorm/entities/order/transaction';
import { Order } from 'src/typeorm/entities/order/order';
import { Ticket } from 'src/typeorm/entities/order/ticket';
import { Seat } from 'src/typeorm/entities/cinema/seat';
import { Member } from 'src/typeorm/entities/user/member';
import { User } from 'src/typeorm/entities/user/user';

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async createPayment(total: string) {
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

  async handleReturn(res, query: any) {
    const { orderId, resultCode } = query;

    const transaction = await this.transactionRepository.findOne({
      where: { transaction_code: orderId },
      relations: ['order', 'order.orderDetails', 'order.orderDetails.ticket', 'order.orderDetails.ticket.seat', 'order.user', 'order.user.member'],
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    const order = transaction.order;

    if (Number(resultCode) === 0) {
      transaction.status = 'success';
      order.status = 'success';

      await this.transactionRepository.save(transaction);
      const savedOrder = await this.orderRepository.save(order);

      // const user = await this.userRepository.findOne({
      //   where: { id: order.user.id },
      //   relations: ['member'],
      // });
      // if (!user || !user.member) throw new NotFoundException('User or member not found');

      order.user.member.score += order.add_score;
      await this.memberRepository.save(order.user.member);

      for (const detail of order.orderDetails) {
        const ticket = detail.ticket;
        if (ticket) {
          ticket.status = true;
          if (ticket.seat) {
            ticket.seat.status = true;
            await this.seatRepository.save(ticket.seat);
          }
          await this.ticketRepository.save(ticket);
        }
      }

      return {
        message: 'Payment successful',
        order: savedOrder,
      };
    } else {
      transaction.status = 'failed';
      order.status = 'failed';

      await this.transactionRepository.save(transaction);
      await this.orderRepository.save(order);

      for (const detail of order.orderDetails) {
        const ticket = detail.ticket;
        if (ticket) {
          ticket.status = false;
          if (ticket.seat) {
            ticket.seat.status = false;
            await this.seatRepository.save(ticket.seat);
          }
          await this.ticketRepository.save(ticket);
        }
      }

      return { message: 'Payment failed' };
    }
  }
}
