import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import { Transaction } from 'src/typeorm/entities/order/transaction';
import { Order } from 'src/typeorm/entities/order/order';
import { Ticket } from 'src/typeorm/entities/order/ticket';
import { Seat } from 'src/typeorm/entities/cinema/seat';
import { OrderBillType } from 'src/utils/type';
import { Promotion } from 'src/typeorm/entities/promotion/promotion';
import { TicketType } from 'src/typeorm/entities/order/ticket-type';
import { changeVnToUSD } from 'src/utils/helper';
import { Method } from 'src/enum/payment-menthod.enum';
import { MomoService } from '../momo/momo.service';
import { Role } from 'src/enum/roles.enum';
import { StatusOrder } from 'src/enum/status-order.enum';
import { HistoryScore } from 'src/typeorm/entities/order/history_score';
import { User } from 'src/typeorm/entities/user/user';
import { MyGateWay } from 'src/gateways/seat.gateway';
import { OrderExtra } from 'src/typeorm/entities/order/order-extra';
import * as jwt from 'jsonwebtoken';
import { ForbiddenException } from '@nestjs/common';
import { QrCodeService } from 'src/qrcode/qrcode.service';
@Injectable()
export class PayPalService {
    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(Ticket)
        private readonly ticketRepository: Repository<Ticket>,
        @InjectRepository(HistoryScore)
        private readonly historyScoreRepository: Repository<HistoryScore>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(OrderExtra)
        private readonly orderExtraRepository: Repository<OrderExtra>,


        private momoService: MomoService,
        private readonly gateway: MyGateWay,
        private readonly qrCodeService: QrCodeService,
    ) { }

    async generateAccessToken() {
        const response = await axios.request({
            method: 'POST',
            url: process.env.PAYPAL_BASE_URL_AUTH,
            data: 'grant_type=client_credentials',
            auth: {
                username: process.env.PAYPAL_CLIENT_ID as string,
                password: process.env.PAYPAL_CLIENT_SECRET as string
            }
        });

        return response.data.access_token
    }



    async createOrderPaypal(item: OrderBillType) {
        const accessToken = await this.generateAccessToken();
        if (!accessToken) throw new Error('Failed to generate access token');


        const totalUSD = changeVnToUSD(item.total_prices.toString());

        const response = await axios.post(
            `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
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
                    return_url: process.env.PAYPAL_SUCCESS_URL,
                    cancel_url: process.env.PAYPAL_CANCEL_URL,
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
        if (!accessToken) throw new Error('Failed to generate access token');

        const response = await axios.post(
            `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
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
        const transaction = await this.momoService.getTransactionByOrderId(transactionCode);
        if (transaction.status !== StatusOrder.PENDING) {
            throw new NotFoundException('Transaction is not in pending state');
        }
        const order = transaction.order;
        if (transaction.paymentMethod.id === Method.PAYPAL) {
            const captureResult = await this.captureOrderPaypal(transaction.transaction_code);
            if (captureResult.status !== 'COMPLETED') {
                throw new Error('Payment not completed on PayPal');
            }
        }
        // check signature 


        transaction.status = StatusOrder.SUCCESS;
        order.status = StatusOrder.SUCCESS;

        await this.transactionRepository.save(transaction);
        const savedOrder = await this.orderRepository.save(order);

        // generate QR code
        const endScheduleTime = order.orderDetails[0].ticket.schedule.end_movie_time;
        if (!process.env.JWT_QR_CODE_SECRET) {
            throw new ForbiddenException('JWT QR Code secret is not set');
        }
        const endTime = new Date(endScheduleTime).getTime();
        const now = Date.now();
        const expiresInSeconds = Math.floor((endTime - now) / 1000);

        const jwtOrderID = jwt.sign(
            { orderId: savedOrder.id },
            process.env.JWT_QR_CODE_SECRET,
            {
                expiresIn: expiresInSeconds > 0 ? expiresInSeconds : 60 * 60,
            }
        );
        const qrCode = await this.qrCodeService.generateQrCode(jwtOrderID);

        // Cộng điểm cho người dùng
        if (order.user?.role.role_id === Role.USER) {
            const orderScore = Math.floor(Number(order.total_prices) / 1000);
            const addScore = orderScore - (order.promotion?.exchange ?? 0);
            order.user.score += addScore;
            await this.userRepository.save(order.user);
            // history score
            await this.historyScoreRepository.save({
                score_change: addScore,
                user: order.user,
                order: savedOrder,
            });
            for (const orderDetail of order.orderDetails) {
                const ticket = orderDetail.ticket;
                if (ticket) {
                    ticket.status = true;
                    await this.ticketRepository.save(ticket);
                }
            }
            // 
            if (order.orderExtras && order.orderExtras.length > 0) {
                for (const extra of order.orderExtras) {
                    extra.status = StatusOrder.SUCCESS;
                    await this.orderExtraRepository.save(extra);
                }
            }

            try {
                await this.momoService.sendOrderConfirmationEmail(order, transaction);
            } catch (error) {
                console.error('Mailer error:', error);
                throw new NotFoundException('Failed to send confirmation email');
            }
            // send socket
            this.gateway.onBookSeat({
                schedule_id: order.orderDetails[0].ticket.schedule.id,
                seatIds: order.orderDetails.map(detail => detail.ticket.seat.id),

            })
            return {
                msg: 'Payment successful',
                order,
                qrCode
            };
        }
    }


    async handleReturnCancelPaypal(transactionCode: string) {
        const transaction = await this.momoService.getTransactionByOrderId(transactionCode);
        if (transaction.status !== StatusOrder.PENDING) {
            throw new NotFoundException('Transaction is not in pending state');
        }

        const order = transaction.order;
        transaction.status = StatusOrder.FAILED;
        order.status = StatusOrder.FAILED;
        await this.transactionRepository.save(transaction);
        await this.orderRepository.save(order);

        // Reset trạng thái ghế nếu cần
        for (const detail of order.orderDetails) {
            const ticket = detail.ticket;
            if (ticket?.seat && ticket.schedule) {
                await this.momoService.changeStatusScheduleSeat([ticket.seat.id], ticket.schedule.id);
            }
        }
        this.gateway.onCancelBookSeat({
            schedule_id: order.orderDetails[0].ticket.schedule.id,
            seatIds: order.orderDetails.map(detail => detail.ticket.seat.id),
        });


        return { message: 'Payment failed' };
    }
}
