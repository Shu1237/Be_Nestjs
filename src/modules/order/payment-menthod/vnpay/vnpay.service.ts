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
import { PaymentGateway } from 'src/common/enums/payment_gatewat.enum';
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

  async createOrderVnPay(totalPrice: string, clientIp: string) {
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
    const secretKey = this.configService.get<string>('vnpay.hashSecret');
    if (!secretKey) throw new InternalServerErrorException('Missing VNP_HASH_SECRET');

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
        // Giao dịch thành công - truyền receivedParams làm rawResponse
        return this.handleReturnSuccess(transaction, receivedParams);
      } else {
        // Giao dịch thất bại
        return this.handleReturnFailed(transaction);
      }
    } else {
      return `${this.configService.get<string>('redirectUrls.failureUrl')}`;
    }
  }




  // async createRefund({ orderId, clientIp }: { orderId: number; clientIp: string }) {
  //   // First check if refund record already exists
  //   const existingRefund = await this.orderRefundRepository.findOne({
  //     where: { order: { id: orderId }, payment_gateway: PaymentGateway.VNPAY },
  //     relations: ['order'],
  //   });

  //   if (!existingRefund) {
  //     throw new NotFoundException('Refund record not found');
  //   }

  //   const order = await this.orderRepository.findOne({
  //     where: { id: orderId },
  //   });

  //   if (!order) {
  //     throw new NotFoundException('Order not found');
  //   }

  //   // Find transaction by order
  //   const transaction = await this.transactionRepository.findOne({
  //     where: { order: { id: orderId } },
  //     relations: ['order','order.user'],
  //   });

  //   if (!transaction) {
  //     throw new NotFoundException('Transaction not found');
  //   }

  //   const tmnCode = this.configService.get<string>('vnpay.tmnCode');
  //   const secretKey = this.configService.get<string>('vnpay.hashSecret');
  //   const refundUrl = this.configService.get<string>('vnpay.refundUrl');

  //   if (!tmnCode || !secretKey || !refundUrl) {
  //     throw new InternalServerErrorException('VNPAY configuration is missing');
  //   }



  //   // Use transaction creation date if available, otherwise use current date
  //   const transactionDate = transaction.transaction_date
  //     ? format(new Date(transaction.transaction_date), 'yyyyMMddHHmmss')
  //     : format(new Date(), 'yyyyMMddHHmmss');

  //   const vnpParams: Record<string, string> = {
  //     vnp_RequestId: `VNPREFUND_${Date.now()}`,
  //     vnp_Version: '2.1.0',
  //     vnp_Command: 'refund',
  //     vnp_TmnCode: tmnCode,
  //     vnp_TransactionType: '02', // full refund
  //     vnp_TxnRef: transaction.transaction_code,
  //     vnp_Amount: transaction.order.total_prices,
  //     vnp_OrderInfo: `Refund for order ${order.id}`,
  //     vnp_TransactionNo: existingRefund.transaction_code, // This should be the original VNPay transaction number
  //     vnp_TransactionDate: transactionDate, // Use actual transaction date
  //     vnp_CreateBy: transaction.order.user.username || 'admin', // Use username or default to 'admin'
  //     vnp_CreateDate: format(new Date(), 'yyyyMMddHHmmss'),
  //     vnp_IpAddr: clientIp,

  //   };

  //   // Tạo data để hash theo chuẩn VNPAY
  //   const hashData = [
  //     vnpParams.vnp_RequestId,
  //     vnpParams.vnp_Version,
  //     vnpParams.vnp_Command,
  //     vnpParams.vnp_TmnCode,
  //     vnpParams.vnp_TransactionType,
  //     vnpParams.vnp_TxnRef,
  //     vnpParams.vnp_Amount,
  //     vnpParams.vnp_TransactionNo,
  //     vnpParams.vnp_TransactionDate,
  //     vnpParams.vnp_CreateBy,
  //     vnpParams.vnp_CreateDate,
  //     vnpParams.vnp_IpAddr,
  //     vnpParams.vnp_OrderInfo,
  //   ].join('|');

  //   vnpParams.vnp_SecureHash = crypto
  //     .createHmac('sha512', secretKey)
  //     .update(hashData)
  //     .digest('hex');
  //   try {


  //     // Gửi yêu cầu hoàn tiền
  //     const response = await axios.post(refundUrl, vnpParams, {
  //       headers: { 'Content-Type': 'application/json' },
  //     });



  //     const data = response.data;

  //     if (data.vnp_ResponseCode !== '00') {
  //       throw new InternalServerErrorException(`Refund failed: ${data.vnp_Message}`);
  //     }
  //     const refund = this.orderRefundRepository.create({
  //       order,
  //       request_id: data.vnp_ResponseId || vnpParams.vnp_RequestId,
  //       order_ref_id: data.vnp_TxnRef || vnpParams.vnp_TxnRef,
  //       transaction_code: data.vnp_TransactionNo || vnpParams.vnp_TransactionNo,
  //       refund_amount: transaction.order.total_prices.toString(),
  //       payment_gateway: PaymentGateway.VNPAY,
  //       description: vnpParams.vnp_OrderInfo,
  //       signature: data.vnp_SecureHash || vnpParams.vnp_SecureHash,
  //       timestamp: Date.now(),
  //       refund_status: RefundStatus.SUCCESS,
  //       created_at: new Date(),
  //     });

  //     await this.orderRefundRepository.save(refund);
  //     console.log('VNPay Refund Response:', data);
  //     return data;
  //   } catch (error) {
  //     console.error('VNPay Refund Error:', error?.response?.data || error.message);
  //     throw new InternalServerErrorException(`Refund failed: ${error.message}`);
  //   }
  // }




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

    // 👉 Tạo chuỗi data đúng định dạng: nối các giá trị bằng "|"
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

    const secureHash = crypto.createHmac('sha512', vnp_HashSecret).update(rawData).digest('hex');

    try {
      const res = await axios.post(vnp_ApiUrl, {
        ...params,
        vnp_SecureHash: secureHash,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const data = res.data;

      return {
        method: 'VNPAY',
        status: data.vnp_ResponseCode === '00' && data.vnp_TransactionStatus === '00' ? 'PAID' : 'UNPAID',
        paid: data.vnp_TransactionStatus === '00',
        total: data.vnp_Amount ? parseFloat(data.vnp_Amount) / 100 : 0,
        currency: data.vnp_CurrCode || 'VND',
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to query VNPAY order');
    }
  }






}
