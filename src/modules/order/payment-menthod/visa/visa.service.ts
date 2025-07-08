import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MailerService } from "@nestjs-modules/mailer";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { InternalServerErrorException } from "src/common/exceptions/internal-server-error.exception";
import { changeVNtoUSDToCent } from "src/common/utils/helper";
import { OrderBillType } from "src/common/utils/type";
import { Method } from "src/common/enums/payment-menthod.enum";
import { StatusOrder } from "src/common/enums/status-order.enum";
import { AbstractPaymentService } from "../base/abstract-payment.service";
import { MyGateWay } from "src/common/gateways/seat.gateway";
import { QrCodeService } from "src/common/qrcode/qrcode.service";
import { ScheduleSeat } from "src/database/entities/cinema/schedule_seat";
import { HistoryScore } from "src/database/entities/order/history_score";
import { Order } from "src/database/entities/order/order";
import { OrderExtra } from "src/database/entities/order/order-extra";
import { Ticket } from "src/database/entities/order/ticket";
import { Transaction } from "src/database/entities/order/transaction";
import { User } from "src/database/entities/user/user";
import Stripe from "stripe";

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
        this.stripe = new Stripe(this.configService.get<string>('visa.secretKey') as string);
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

        if (transaction.paymentMethod.id === Method.VISA) {
            const session = await this.retrieveSession(sessionId);
            if (session.payment_status !== 'paid') {
                throw new InternalServerErrorException('Payment not completed on Stripe');
            }
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
}


