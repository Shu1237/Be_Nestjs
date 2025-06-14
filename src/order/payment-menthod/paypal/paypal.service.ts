import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
import { changeVnToUSD } from 'src/utils/helper';
import { Method } from 'src/enum/payment-menthod.enum';
import { MailerService } from '@nestjs-modules/mailer';
import { MomoService } from '../momo/momo.service';

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
        @InjectRepository(Promotion)
        private readonly promotionRepository: Repository<Promotion>,
        @InjectRepository(TicketType)
        private readonly ticketTypeRepository: Repository<TicketType>,

        private mailerService: MailerService,
        private momoService: MomoService
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

        const totalUSD = changeVnToUSD(totalPriceVND.toString());

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
        if (!transaction) throw new NotFoundException('Transaction not found');
        // 1. Confirm transaction status

        if (transaction.paymentMethod.id === Method.PAYPAL) {
            const captureResult = await this.captureOrderPaypal(transaction.transaction_code);
            if (captureResult.status !== 'COMPLETED') {
                throw new Error('Payment not completed on PayPal');
            }
        }
        transaction.status = 'success';
        await this.transactionRepository.save(transaction);

        if (!transaction.order) throw new NotFoundException('Order not found for this transaction');

        transaction.order.status = 'success';
        await this.orderRepository.save(transaction.order);
        const order = transaction.order;

        order.user.member.score += order.add_score;
        await this.memberRepository.save(order.user.member);

        for (const orderDetail of order.orderDetails) {
            const ticket = orderDetail.ticket;
            if (ticket) {
                ticket.status = true;
                await this.ticketRepository.save(ticket);
            }
        }
        try {
            const firstTicket = order.orderDetails[0]?.ticket;
            await this.mailerService.sendMail({
                to: order.user.email,
                subject: 'Your Order Successful',
                template: 'order-confirmation',
                context: {
                    user: order.user.username,
                    transactionCode: transaction.transaction_code,
                    bookingDate: order.booking_date,
                    total: order.total_prices,
                    addScore: order.add_score,
                    paymentMethod: transaction.paymentMethod.name,
                    year: new Date().getFullYear(),

                    // Thông tin chung 1 lần
                    movieName: firstTicket?.schedule.movie.name,
                    showDate: firstTicket?.schedule.show_date,
                    roomName: firstTicket?.schedule.cinemaRoom.cinema_room_name,

                    // Danh sách ghế
                    seats: order.orderDetails.map(detail => ({
                        row: detail.ticket.seat.seat_row,
                        column: detail.ticket.seat.seat_column,
                        ticketType: detail.ticket.ticketType.ticket_name,
                        price: detail.total_each_ticket,
                    })),
                },
            });
        } catch (error) {
            throw new NotFoundException('Failed to send confirmation email');
        }

        return {
            msg: 'Payment successful',
            order
        };
    }


    async handleReturnCancelPaypal(transactionCode: string) {
        const transaction = await this.momoService.getTransactionByOrderId(transactionCode);
        if (!transaction) throw new NotFoundException('Transaction not found');
        const order = transaction.order;
        transaction.status = 'failed';
        order.status = 'failed';
        await this.transactionRepository.save(transaction);
        await this.orderRepository.save(order);

        // Reset trạng thái ghế nếu cần
        for (const detail of order.orderDetails) {
            const ticket = detail.ticket;
            if (ticket?.seat && ticket.schedule) {
                await this.momoService.changeStatusScheduleSeat([ticket.seat.id], ticket.schedule.id);
            }
        }

        return { message: 'Payment failed' };
    }
}
