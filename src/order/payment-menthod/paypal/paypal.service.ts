import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';

import { Transaction } from 'src/typeorm/entities/order/transaction';
import { Order } from 'src/typeorm/entities/order/order';
import { Ticket } from 'src/typeorm/entities/order/ticket';
import { Seat } from 'src/typeorm/entities/cinema/seat';
import { Member } from 'src/typeorm/entities/user/member';
import { User } from 'src/typeorm/entities/user/user';
import { OrderBillType } from 'src/utils/type';
import { Promotion } from 'src/typeorm/entities/promotion/promotion';
import { TicketType } from 'src/typeorm/entities/order/ticket-type';
import { changeVNtoUSDToCent } from 'src/utils/helper';

@Injectable()
export class PayPalService {
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
        private readonly userRepository: Repository<User>,
        @InjectRepository(Promotion)
        private readonly promotionRepository: Repository<Promotion>,
        @InjectRepository(TicketType)
        private readonly ticketTypeRepository: Repository<TicketType>
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

    async getSeatBasePrice(seatId: string): Promise<number> {
        const seat = await this.seatRepository.findOne({
            where: { id: seatId },
            relations: ['seatType']
        });
        if (!seat) throw new Error(`Seat with ID ${seatId} not found`);
        return seat.seatType.seat_type_price;
    }

    async getTicketDiscount(audienceType: string): Promise<number> {
        const ticketType = await this.ticketTypeRepository.findOne({
            where: { audience_type: audienceType },
        });
        if (!ticketType) throw new Error(`Ticket type not found for audience: ${audienceType}`);
        return Number(ticketType.discount);
    }

    async createOrderPaypal(item: OrderBillType) {
        const accessToken = await this.generateAccessToken();
        if (!accessToken) throw new Error('Failed to generate access token');

        const promotion = item.promotion_id
            ? await this.promotionRepository.findOne({ where: { id: item.promotion_id } })
            : null;
        const promotionDiscount = promotion ? Number(promotion.discount) : 0;

        let totalPriceVND = 0;

        for (const seat of item.seats) {
            const basePrice = await this.getSeatBasePrice(seat.id);
            const ticketDiscount = await this.getTicketDiscount(seat.audience_type);

            const discountedPrice = basePrice * (1 - ticketDiscount / 100);
            const finalPrice = discountedPrice * (1 - promotionDiscount / 100);

            totalPriceVND += finalPrice;
        }

        const totalUSD = changeVNtoUSDToCent(totalPriceVND.toString());

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

    async getTransactionByOrderId(orderId: string) {
        if (!orderId) throw new NotFoundException('Order ID is required');

        const transaction = await this.transactionRepository.findOne({
            where: { transaction_code: orderId },
            relations: ['order', 'order.orderDetails', 'order.orderDetails.ticket', 'order.orderDetails.ticket.seat', 'order.user', 'order.user.member'],
        });

        if (!transaction) throw new NotFoundException('Transaction not found');
        return transaction;
    }

    async handleReturnSuccessPaypal(transactionCode: string) {
        const transaction = await this.getTransactionByOrderId(transactionCode);
        if (!transaction) throw new NotFoundException('Transaction not found');

        transaction.status = 'success';
        await this.transactionRepository.save(transaction);

        if (!transaction.order) throw new NotFoundException('Order not found for this transaction');

        transaction.order.status = 'success';
        await this.orderRepository.save(transaction.order);
        const order = transaction.order;

        order.user.member.score += order.add_score;
        await this.memberRepository.save(order.user.member);

        return {
            msg: 'Payment successful',
            order
        };
    }

    async handleReturnCancelPaypal(transactionCode: string) {
        const transaction = await this.getTransactionByOrderId(transactionCode);
        if (!transaction) throw new NotFoundException('Transaction not found');

        transaction.status = 'failed';
        await this.transactionRepository.save(transaction);

        if (!transaction.order) throw new NotFoundException('Order not found for this transaction');

        transaction.order.status = 'failed';
        await this.orderRepository.save(transaction.order);

        for (const orderDetail of transaction.order.orderDetails) {
            const ticket = orderDetail.ticket;
            if (ticket) {
                ticket.status = false;
                if (ticket.seat) {
                    ticket.seat.status = false;
                    await this.seatRepository.save(ticket.seat);
                }
                await this.ticketRepository.save(ticket);
            }
        }

        return {
            msg: 'Payment cancelled',
        };
    }
}
