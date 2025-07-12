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
import { Role } from 'src/common/enums/roles.enum';
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



}
