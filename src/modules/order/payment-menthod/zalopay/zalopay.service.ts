import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';
import * as moment from 'moment';
import * as dayjs from 'dayjs';
import { OrderBillType } from 'src/common/utils/type';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { MyGateWay } from 'src/common/gateways/seat.gateway';
import { QrCodeService } from 'src/common/qrcode/qrcode.service';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { HistoryScore } from 'src/database/entities/order/history_score';
import { Order } from 'src/database/entities/order/order';
import { OrderExtra } from 'src/database/entities/order/order-extra';
import { Ticket } from 'src/database/entities/order/ticket';
import { User } from 'src/database/entities/user/user';
import { Repository } from 'typeorm';
import { Transaction } from 'src/database/entities/order/transaction';
import { AbstractPaymentService } from '../base/abstract-payment.service';
import { OrderRefund } from 'src/database/entities/order/order_refund';

@Injectable()
export class ZalopayService extends AbstractPaymentService {
  constructor(
    @InjectRepository(Transaction)
    transactionRepository: Repository<Transaction>,
    @InjectRepository(Order)
    orderRepository: Repository<Order>,
    @InjectRepository(Ticket)
    ticketRepository: Repository<Ticket>,
    @InjectRepository(ScheduleSeat)
    scheduleSeatRepository: Repository<ScheduleSeat>,
    @InjectRepository(HistoryScore)
    historyScoreRepository: Repository<HistoryScore>,
    @InjectRepository(User)
    userRepository: Repository<User>,
    @InjectRepository(OrderExtra)
    orderExtraRepository: Repository<OrderExtra>,
    @InjectRepository(OrderRefund)
    orderRefundRepository: Repository<OrderRefund>,
    mailerService: MailerService,
    gateway: MyGateWay,
    qrCodeService: QrCodeService,
    configService: ConfigService,
    jwtService: JwtService,
  ) {
    super(
      transactionRepository,
      orderRepository,
      ticketRepository,
      scheduleSeatRepository,
      historyScoreRepository,
      userRepository,
      orderExtraRepository,
      orderRefundRepository,
      mailerService,
      gateway,
      qrCodeService,
      configService,
      jwtService,
    );
  }

  async createOrderZaloPay(orderItem: OrderBillType) {
    const app_id = this.configService.get<string>('zalopay.appId');
    const key1 = this.configService.get<string>('zalopay.key1');
    const endpoint = this.configService.get<string>('zalopay.endpoint');
    const callback_url = this.configService.get<string>('zalopay.returnUrl');

    if (!app_id || !key1 || !endpoint) {
      throw new InternalServerErrorException('ZaloPay configuration is missing');
    }

    if (!orderItem || !Array.isArray(orderItem.seats) || orderItem.seats.length === 0) {
      throw new InternalServerErrorException('No seat selected');
    }

    const transID = Date.now();
    const app_trans_id = `${moment().format('YYMMDD')}_${transID}`;
    const app_time = dayjs().valueOf();
    const embed_data = { redirecturl: callback_url };

    const rawData = {
      app_id: Number(app_id),
      app_trans_id,
      app_user: 'ZaloPay Movie Theater',
      amount: Number(orderItem.total_prices),
      app_time,
      item: JSON.stringify([
        {
          itemid: `order_${app_id}`,
          itemname: 'Thanh toan don hang',
          itemprice: Number(orderItem.total_prices),
          itemquantity: 1,
        },
      ]),
      embed_data: JSON.stringify(embed_data),
      description: 'Thanh toan ve xem phim',
      bank_code: 'zalopayapp',
    };

    const dataToMac = [
      rawData.app_id,
      rawData.app_trans_id,
      rawData.app_user,
      rawData.amount,
      rawData.app_time,
      rawData.embed_data,
      rawData.item,
    ].join('|');

    const mac = crypto.createHmac('sha256', key1).update(dataToMac).digest('hex');

    const requestBody = {
      ...rawData,
      mac,
    };

    try {
      const res = await axios.post(endpoint, requestBody, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.data.return_code !== 1) {
        throw new InternalServerErrorException(
          `ZaloPay error: ${res.data.sub_return_message}`,
        );
      }
      // console.log('ZaloPay order created:', res.data);
      return {
        payUrl: res.data.order_url,
        orderId: app_trans_id,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'ZaloPay API failed: ' +
        (error.response?.data?.sub_return_message || error.message),
      );
    }
  }

  async handleReturnZaloPay(query: any) {
    const { apptransid, status } = query;
    const transaction = await this.getTransactionByOrderId(apptransid);

    if (transaction.status !== StatusOrder.PENDING) {
      throw new NotFoundException('Transaction is not in pending state');
    }

    if (status === '1') {
      return this.handleReturnSuccess(transaction, query);
    } else {
      return this.handleReturnFailed(transaction);
    }
  }

  // async createRefund() {
  //   const { zp_trans_id, amount, description, refund_fee_amount } = params;

  //   const app_id = this.configService.get<string>('zalopay.appId');
  //   const key1 = this.configService.get<string>('zalopay.key1');
  //   const endpoint = this.configService.get<string>('zalopay.refundEndpoint');

  //   if (!app_id || !key1 || !endpoint) {
  //     throw new InternalServerErrorException('ZaloPay refund config is missing');
  //   }

  //   const m_refund_id = `${moment().format('YYMMDD')}_${app_id}_${Date.now()}`;
  //   const timestamp = Date.now();

  //   // Build MAC input
  //   let hmacInput: string;
  //   if (typeof refund_fee_amount === 'number') {
  //     hmacInput = `${app_id}|${zp_trans_id}|${amount}|${refund_fee_amount}|${description}|${timestamp}`;
  //   } else {
  //     hmacInput = `${app_id}|${zp_trans_id}|${amount}|${description}|${timestamp}`;
  //   }

  //   const mac = crypto.createHmac('sha256', key1).update(hmacInput).digest('hex');

  //   const requestBody: any = {
  //     m_refund_id,
  //     app_id: Number(app_id),
  //     zp_trans_id,
  //     amount,
  //     timestamp,
  //     description,
  //     mac,
  //   };

  //   if (typeof refund_fee_amount === 'number') {
  //     requestBody.refund_fee_amount = refund_fee_amount;
  //   }

  //   try {
  //     const response = await axios.post(endpoint, requestBody, {
  //       headers: { 'Content-Type': 'application/json' },
  //     });

  //     return response.data;
  //   } catch (error) {
  //     console.error('ZaloPay refund error:', error?.response?.data || error.message);
  //     throw new InternalServerErrorException(
  //       'ZaloPay refund API failed: ' +
  //       (error?.response?.data?.sub_return_message || error.message),
  //     );
  //   }
  // }

}
