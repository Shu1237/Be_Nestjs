import { ForbiddenException, Injectable, NotFoundException, Redirect } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Transaction } from 'src/database/entities/order/transaction';
import { Order } from 'src/database/entities/order/order';
import { Ticket } from 'src/database/entities/order/ticket';
import { MailerService } from '@nestjs-modules/mailer';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { HistoryScore } from 'src/database/entities/order/history_score';
import { User } from 'src/database/entities/user/user';
import { OrderExtra } from 'src/database/entities/order/order-extra';
import { MyGateWay } from 'src/common/gateways/seat.gateway';
import { QrCodeService } from 'src/common/qrcode/qrcode.service';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from 'src/common/exceptions/internal-server-error.exception';
import { JwtService } from '@nestjs/jwt';
import { AbstractPaymentService } from '../base/abstract-payment.service';
import { PaymentGateway } from 'src/common/enums/payment_gatewat.enum';
@Injectable()
export class MomoService extends AbstractPaymentService {
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

  async createOrderMomo(total: string) {
    const accessKey = this.configService.get<string>('momo.accessKey');
    const secretKey = this.configService.get<string>('momo.secretKey');
    const partnerCode = this.configService.get<string>('momo.partnerCode');

    if (!accessKey || !secretKey || !partnerCode) {
      throw new InternalServerErrorException('Momo configuration is missing');
    }

    const requestId = partnerCode + new Date().getTime();
    const orderId = requestId;
    const orderInfo = 'Momo payment';
    const redirectUrl = this.configService.get<string>('momo.redirectUrl');
    const ipnUrl = this.configService.get<string>('momo.ipnUrl');
    const requestType = 'payWithMethod';
    const extraData = '';
    const autoCapture = true;

    const rawSignature = `accessKey=${accessKey}&amount=${total}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
    // console.log('Momo signature:', signature);
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
      return {
        error: 'Failed to create Momo payment',
        detail: error?.response?.data,
      };
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
      return this.handleReturnSuccess(transaction, query);
    } else {
      // Giao dịch thất bại
      return this.handleReturnFailed(transaction);
    }

  }
  // async createRefund({ orderId }: { orderId: number }) {
  //   const accessKey = this.configService.get<string>('momo.accessKey');
  //   const secretKey = this.configService.get<string>('momo.secretKey');
  //   const partnerCode = this.configService.get<string>('momo.partnerCode');

  //   if (!partnerCode || !accessKey || !secretKey) {
  //     throw new InternalServerErrorException('Momo configuration is missing');
  //   }

  //   const refund = await this.orderRefundRepository.findOne({
  //     where: { order: { id: orderId }, payment_gateway: PaymentGateway.MOMO },
  //     relations: ['order'],
  //   });

  //   if (!refund) {
  //     throw new NotFoundException('Refund record not found');
  //   }

  //   const {
  //     refund_amount,
  //     description,
  //     request_id,
  //     transaction_code,
  //     order_ref_id,
  //   } = refund;

  //   // ✅ Tạo signature mới (chính xác)
  //   const rawSignature = `accessKey=${accessKey}&amount=${Number(refund_amount)}&description=${description}&orderId=${order_ref_id}&partnerCode=${partnerCode}&requestId=${request_id}&transId=${transaction_code}`;

  //   const signature = crypto
  //     .createHmac('sha256', secretKey)
  //     .update(rawSignature)
  //     .digest('hex');

  //   const requestBody = {
  //     partnerCode,
  //     orderId: order_ref_id, // ✅ Dùng order_ref_id duy nhất
  //     requestId: request_id,
  //     amount: Number(refund_amount),
  //     transId: transaction_code,
  //     lang: refund.lang || 'vi',
  //     description,
  //     signature,
  //   };


  //   try {
  //     const res = await axios.post(
  //       'https://test-payment.momo.vn/v2/gateway/api/refund',
  //       requestBody,
  //       {
  //         headers: { 'Content-Type': 'application/json' },
  //       },
  //     );

  //     if (res.data.resultCode !== 0) {
  //       throw new InternalServerErrorException(`Refund failed: ${res.data.message}`);
  //     }

  //     // ✅ Cập nhật trạng thái + lưu lại signature chính xác nếu cần
  //     refund.refund_status = RefundStatus.SUCCESS;
  //     refund.signature = signature;


  //     await this.orderRefundRepository.save(refund);


  //     return res.data;
  //   } catch (error) {
  //     throw new InternalServerErrorException(
  //       'Refund request failed: ' + (error?.response?.data?.message || error.message),
  //     );
  //   }
  // }
  async queryOrderStatusMomo(orderId: string) {
    const accessKey = this.configService.get<string>('momo.accessKey');
    const secretKey = this.configService.get<string>('momo.secretKey');
    const partnerCode = this.configService.get<string>('momo.partnerCode');
    const endpoint = this.configService.get<string>('momo.queryUrl');
    if (!accessKey || !secretKey || !partnerCode || !endpoint) {
      throw new InternalServerErrorException('Momo configuration is missing');
    }

    const requestId = partnerCode + Date.now(); // Hoặc có thể dùng UUID

    const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const body = {
      partnerCode,
      requestId,
      orderId,
      lang: 'vi',
      signature,
    };

    try {
      const response = await axios.post(
        endpoint,
        body,
        { headers: { 'Content-Type': 'application/json' } },
      );
      return {
        method: PaymentGateway.MOMO,
        status: response.data.resultCode === 0 ? 'PAID' : 'UNPAID',
        paid: response.data.resultCode === 0,
      };
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to query MoMo order', error?.response?.data);
    }
  }





}
