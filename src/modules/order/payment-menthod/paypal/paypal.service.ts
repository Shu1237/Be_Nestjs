import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { Repository } from 'typeorm';
import { OrderBillType } from 'src/common/utils/type';
import { changeVnToUSD } from 'src/common/utils/helper';
import { Method } from 'src/common/enums/payment-menthod.enum';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { InternalServerErrorException } from 'src/common/exceptions/internal-server-error.exception';
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
import { PaymentGateway } from 'src/common/enums/payment_gatewat.enum';


@Injectable()
export class PayPalService extends AbstractPaymentService {

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
    async generateAccessToken() {
        const response = await axios.request({
            method: 'POST',
            url: this.configService.get<string>('paypal.authUrl'),
            data: 'grant_type=client_credentials',
            auth: {
                username: this.configService.get<string>('paypal.clientId')!,
                password: this.configService.get<string>('paypal.clientSecret')!
            }
        });

        return response.data.access_token
    }

    async createOrderPaypal(item: OrderBillType) {
        const accessToken = await this.generateAccessToken();
        if (!accessToken) throw new InternalServerErrorException('Failed to generate access token');

        const totalUSD = changeVnToUSD(item.total_prices.toString());

        const response = await axios.post(
            `${this.configService.get<string>('paypal.baseUrl')}/v2/checkout/orders`,
            {
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        amount: {
                            currency_code: 'USD',
                            value: totalUSD,
                        },
                        description: `Booking for schedule ${item.schedule_id}, total seats: ${item.seats.length}`,
                    },
                ],
                application_context: {
                    return_url: this.configService.get<string>('paypal.successUrl'),
                    cancel_url: this.configService.get<string>('paypal.cancelUrl'),
                    shipping_preference: 'NO_SHIPPING',
                    user_action: 'PAY_NOW',
                    brand_name: 'manfra.io',
                },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        return {
            payUrl: response.data.links.find((link: any) => link.rel === 'approve')?.href,
            orderId: response.data.id,
        };
    }

    async captureOrderPaypal(orderId: string) {
        const accessToken = await this.generateAccessToken();
        if (!accessToken) throw new InternalServerErrorException('Failed to generate access token');

        const response = await axios.post(
            `${this.configService.get<string>('paypal.baseUrl')}/v2/checkout/orders/${orderId}/capture`,
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        return response.data;
    }

    async handleReturnSuccessPaypal(transactionCode: string) {
        const transaction = await this.getTransactionByOrderId(transactionCode);
        if (transaction.status !== StatusOrder.PENDING) {
            throw new NotFoundException('Transaction is not in pending state');
        }
        if (transaction.paymentMethod.id === Method.PAYPAL) {
            const captureResult = await this.captureOrderPaypal(transaction.transaction_code);
            if (captureResult.status !== 'COMPLETED') {
                throw new InternalServerErrorException('Payment not completed on PayPal');
            }
            // Pass the captureResult as rawResponse to create refund record properly
            return this.handleReturnSuccess(transaction, captureResult);
        }
        return this.handleReturnSuccess(transaction);
    }

    async handleReturnCancelPaypal(transactionCode: string) {
        const transaction = await this.getTransactionByOrderId(transactionCode);
        if (transaction.status !== StatusOrder.PENDING) {
            throw new NotFoundException('Transaction is not in pending state');
        }
        return this.handleReturnFailed(transaction);
    }

    // async createRefund({ orderId }: { orderId: number }) {
    //     const accessToken = await this.generateAccessToken();
    //     const refund = await this.orderRefundRepository.findOne({
    //         where: { order: { id: orderId }, payment_gateway: PaymentGateway.PAYPAL },
    //         relations: ['order'],
    //     });


    //     if (!refund) {
    //         throw new NotFoundException('Refund record not found');
    //     }

    //     try {
    //         // Use the capture ID stored in request_id field from the refund record
    //         const captureId = refund.request_id || refund.transaction_code;

    //         const res = await axios.post(
    //             `${this.configService.get<string>('paypal.baseUrl')}/v2/payments/captures/${captureId}/refund`,
    //             {
    //                 amount: {
    //                     value: changeVnToUSD(refund.order.total_prices.toString()),
    //                     currency_code: refund.currency_code || 'USD',
    //                 },
    //             },
    //             {
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                     Authorization: `Bearer ${accessToken}`,
    //                 },
    //             }
    //         );
    //         //  update status of refund 
    //             refund.refund_status = RefundStatus.SUCCESS;
    //             await this.orderRefundRepository.save(refund);
    //         return res.data;
    //     } catch (error) {
    //         throw new InternalServerErrorException(
    //             'Refund request failed: ' + (error?.response?.data?.message || error.message)
    //         );
    //     }
    // }

    async queryOrderStatusPaypal(orderId: string) {
        const accessToken = await this.generateAccessToken();
        if (!accessToken) {
            throw new InternalServerErrorException('Failed to generate PayPal access token');
        }

        const response = await axios.get(
            `${this.configService.get<string>('paypal.baseUrl')}/v2/checkout/orders/${orderId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const data = response.data;

        return {
            method: PaymentGateway.PAYPAL,
            status: data.status, // e.g., COMPLETED, PAYER_ACTION_REQUIRED
            paid: data.status === 'COMPLETED',
            payerEmail: data.payer?.email_address,
        };
    }


}
