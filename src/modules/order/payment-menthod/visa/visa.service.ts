import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InternalServerErrorException } from 'src/common/exceptions/internal-server-error.exception';
import { changeVNtoUSDToCent } from 'src/common/utils/helper';
import { OrderBillType } from 'src/common/utils/type';
import { Method } from 'src/common/enums/payment-menthod.enum';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { AbstractPaymentService } from '../base/abstract-payment.service';
import { MyGateWay } from 'src/common/gateways/seat.gateway';
import { QrCodeService } from 'src/common/qrcode/qrcode.service';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { HistoryScore } from 'src/database/entities/order/history_score';
import { Order } from 'src/database/entities/order/order';
import { OrderExtra } from 'src/database/entities/order/order-extra';
import { Ticket } from 'src/database/entities/order/ticket';
import { Transaction } from 'src/database/entities/order/transaction';
import { User } from 'src/database/entities/user/user';
import Stripe from 'stripe';
import { PaymentGateway } from 'src/common/enums/payment_gatewat.enum';

@Injectable()
export class VisaService extends AbstractPaymentService {
  private stripe: Stripe;

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
    this.stripe = new Stripe(
      this.configService.get<string>('visa.secretKey') as string,
    );
  }

  async createOrderVisa(orderBill: OrderBillType) {
    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Order Bill Payment by Visa',
            },
            unit_amount: changeVNtoUSDToCent(orderBill.total_prices),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${this.configService.get<string>('visa.successUrl')}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get<string>('visa.cancelUrl')}?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        payment_method_id: orderBill.payment_method_id,
        promotion_id: orderBill.promotion_id.toString(),
        schedule_id: orderBill.schedule_id.toString(),
        total_prices: orderBill.total_prices,
      },
    });
    const url = {
      payUrl: session.url,
      orderId: session.id,
    };
    return url;
  }

  async retrieveSession(sessionId: string) {
    return await this.stripe.checkout.sessions.retrieve(sessionId);
  }

  async handleReturnSuccessVisa(sessionId: string) {
    const transaction = await this.getTransactionByOrderId(sessionId);
    if (transaction.status !== StatusOrder.PENDING) {
      throw new NotFoundException('Transaction is not in pending state');
    }
    const session = await this.retrieveSession(sessionId);
    if (session.payment_status !== 'paid') {
      throw new InternalServerErrorException(
        'Payment not completed on Stripe',
      );
    }
    return this.handleReturnSuccess(transaction);
  }

  async handleReturnCancelVisa(sessionId: string) {
    const transaction = await this.getTransactionByOrderId(sessionId);
    if (transaction.status !== StatusOrder.PENDING) {
      throw new NotFoundException('Transaction is not in pending state');
    }
    return this.handleReturnFailed(transaction);
  }

  // async createRefund({ orderId }: { orderId: number }) {
  //     const refund = await this.orderRefundRepository.findOne({
  //         where: { order: { id: orderId }, payment_gateway: PaymentGateway.VISA },
  //         relations: ['order'],
  //     });

  //     if (!refund) {
  //         throw new NotFoundException('Refund record not found');
  //     }

  //     // If payment_intent_id is not available, try to get it from session
  //     let paymentIntentId = refund.payment_intent_id;

  //     if (!paymentIntentId && refund.order_ref_id) {
  //         try {
  //             const session = await this.stripe.checkout.sessions.retrieve(refund.order_ref_id);
  //             paymentIntentId = session.payment_intent as string;

  //             // Update refund record with payment_intent_id
  //             if (paymentIntentId) {
  //                 refund.payment_intent_id = paymentIntentId;
  //                 await this.orderRefundRepository.save(refund);
  //             }
  //         } catch (error) {
  //             console.error('Error retrieving session:', error);
  //             throw new InternalServerErrorException('Failed to retrieve session for refund');
  //         }
  //     }

  //     if (!paymentIntentId) {
  //         throw new InternalServerErrorException('Missing payment_intent_id to refund Stripe');
  //     }

  //     try {
  //         const refundStripe = await this.stripe.refunds.create({
  //             payment_intent: paymentIntentId,
  //             amount: changeVNtoUSDToCent(refund.refund_amount.toString()), // Convert VND to USD cents
  //         });

  //         if (refundStripe.status !== 'succeeded') {
  //             throw new InternalServerErrorException(`Refund failed: ${refundStripe.status}`);
  //         }

  //         refund.refund_status = RefundStatus.SUCCESS;
  //         refund.timestamp = Math.floor(new Date().getTime() / 1000);

  //         await this.orderRefundRepository.save(refund);

  //     } catch (error) {
  //         throw new InternalServerErrorException('Stripe refund failed: ' + error.message);
  //     }
  // }
  async queryOrderStatusVisa(orderId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(orderId, {
      expand: ['payment_intent'],
    });

    return {
      method: PaymentGateway.VISA,
      status: session.payment_status?.toUpperCase() || 'UNKNOWN',
      paid: session.payment_status === 'paid',
      total: (session.amount_total ? session.amount_total / 100 : 0).toFixed(2),
      currency: session.currency || 'USD',
    };
  }
}
