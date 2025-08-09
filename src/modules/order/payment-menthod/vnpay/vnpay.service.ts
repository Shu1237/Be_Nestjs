import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as qs from 'qs';
import * as moment from 'moment';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from 'src/common/exceptions/internal-server-error.exception';
import { AbstractPaymentService } from '../base/abstract-payment.service';
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
import axios from 'axios';
import { formatDate } from 'src/common/utils/helper';

@Injectable()
export class VnpayService extends AbstractPaymentService {
  [x: string]: any;
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
      mailerService,
      gateway,
      qrCodeService,
      configService,
      jwtService,
    );
  }

   createOrderVnPay(totalPrice: string, clientIp: string) {
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const orderId = moment(date).format('DDHHmmss');

    const tmnCode = this.configService.get<string>('vnpay.tmnCode');
    const secretKey = this.configService.get<string>('vnpay.hashSecret');
    const vnpUrl = this.configService.get<string>('vnpay.url');
    const returnUrl = this.configService.get<string>('vnpay.returnUrl');

    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
      throw new InternalServerErrorException('VNPAY configuration is missing');
    }

    const amount = Number(totalPrice);
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

  
    const sortedParams: Record<string, string> = {};
    Object.keys(vnp_Params)
      .sort()
      .forEach((key) => {
        sortedParams[key] = vnp_Params[key];
      });


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


    const sortedParams: Record<string, string> = {};
    Object.keys(receivedParams)
      .sort()
      .forEach((key) => {
        sortedParams[key] = receivedParams[key];
      });

    const signData = qs.stringify(sortedParams, { encode: false });
    const secretKey = this.configService.get<string>('vnpay.hashSecret');
    if (!secretKey)
      throw new InternalServerErrorException('Missing VNP_HASH_SECRET');

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      const responseCode = receivedParams['vnp_ResponseCode'];
      const txnRef = receivedParams['vnp_TxnRef'];
      const transaction = await this.getTransactionByOrderId(txnRef);
      if (transaction.status !== StatusOrder.PENDING) {
        throw new NotFoundException('Transaction is not in pending state');
      }
      if (responseCode === '00') {
        //  transaction success
        return this.handleReturnSuccess(transaction);
      } else {
        //  transaction failed
        return this.handleReturnFailed(transaction);
      }
    } else {
      return `${this.configService.get<string>('redirectUrls.failureUrl')}`;
    }
  }

 
  async queryOrderStatusVnpay(orderId: string, transactionDate: string) {
    const vnp_TmnCode = this.configService.get<string>('vnpay.tmnCode');
    const vnp_HashSecret = this.configService.get<string>('vnpay.hashSecret');
    const vnp_ApiUrl = this.configService.get<string>('vnpay.queryUrl');

    if (!vnp_TmnCode || !vnp_HashSecret || !vnp_ApiUrl) {
      throw new InternalServerErrorException('VNPAY config is missing');
    }

    const requestId = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const createDate = formatDate(new Date());
    const ipAddr = '127.0.0.1';
    const orderInfo = 'Query order status';

    const params = {
      vnp_RequestId: requestId,
      vnp_Version: '2.1.0',
      vnp_Command: 'querydr',
      vnp_TmnCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_TransactionDate: transactionDate,
      vnp_CreateDate: createDate,
      vnp_IpAddr: ipAddr,
    };


    const rawData = [
      params.vnp_RequestId,
      params.vnp_Version,
      params.vnp_Command,
      params.vnp_TmnCode,
      params.vnp_TxnRef,
      params.vnp_TransactionDate,
      params.vnp_CreateDate,
      params.vnp_IpAddr,
      params.vnp_OrderInfo,
    ].join('|');

    const secureHash = crypto
      .createHmac('sha512', vnp_HashSecret)
      .update(rawData)
      .digest('hex');

    try {
      const res = await axios.post(
        vnp_ApiUrl,
        {
          ...params,
          vnp_SecureHash: secureHash,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const data = res.data;

      return {
        method: 'VNPAY',
        status:
          data.vnp_ResponseCode === '00' && data.vnp_TransactionStatus === '00'
            ? 'PAID'
            : 'UNPAID',
        paid: data.vnp_TransactionStatus === '00',
        total: data.vnp_Amount ? parseFloat(data.vnp_Amount) / 100 : 0,
        currency: data.vnp_CurrCode || 'VND',
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to query VNPAY order status: ' + error.message);
    }
  }
}
