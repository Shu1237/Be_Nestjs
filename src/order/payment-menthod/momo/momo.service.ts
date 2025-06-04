import { Injectable, NotFoundException } from "@nestjs/common";
import * as crypto from 'crypto';
import axios from 'axios';
import { Transaction } from "src/typeorm/entities/order/transaction";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "src/typeorm/entities/order/order";
import { Ticket } from "src/typeorm/entities/order/ticket";
import { Seat } from "src/typeorm/entities/cinema/seat";

@Injectable()
export class MomoService {

    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(Ticket)
        private readonly ticketRepository: Repository<Ticket>,
        @InjectRepository(Seat)
        private readonly seatRepository: Repository<Seat>,
    ) { }
    async createPayment(total: string) {
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const secretKey = process.env.MOMO_SECRET_KEY;
        const orderInfo = 'Momo payment';
        const partnerCode = process.env.MOMO_PARTNER_CODE;
        if (!accessKey || !secretKey || !partnerCode) {
            throw new Error('Momo configuration is missing');
        }
        const redirectUrl = process.env.MOMO_REDIRECT_URL;
        const ipnUrl = process.env.MOMO_IPN_URL;
        const requestType = "payWithMethod";
        const amount = total;
        const orderId = partnerCode + new Date().getTime();
        const requestId = orderId;
        const extraData = '';
        const orderGroupId = '';
        const autoCapture = true;
        const lang = 'vi';


        const rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType;
        const signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = JSON.stringify({
            partnerCode,
            partnerName: 'CINEMA',
            storeId: 'MyStore',
            requestId,
            amount,
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            lang,
            requestType,
            autoCapture,
            extraData,
            orderGroupId,
            signature
        });

        const options = {
            method: 'POST',
            url: 'https://test-payment.momo.vn/v2/gateway/api/create',
            data: requestBody,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        try {
            const result = await axios.post(options.url, options.data, { headers: options.headers });
            return result.data;
        } catch (error: any) {
            console.error('Error detail:', error?.response?.data || error.message);
            return {
                error: 'Failed to create payment',
                detail: error?.response?.data,
            };
        }



    }


    async handleReturn(res, query: any) {
        const { orderId, resultCode } = query;

        const transaction = await this.transactionRepository.findOne({
            where: { transaction_code: orderId },
            relations: [
                'order',
                'order.orderDetails',
                'order.orderDetails.ticket',
                'order.orderDetails.ticket.seat'
            ],
        });

        if (!transaction) {
            console.log('Transaction not found with orderId:', orderId);
            throw new NotFoundException('Transaction not found');
        }

        const order = transaction.order;

        if (Number(resultCode) === 0) {
            transaction.status = 'success';
            order.status = 'success';

            await this.transactionRepository.save(transaction);
            const orderSaveResult = await this.orderRepository.save(order);

            return {
                message: 'Payment successful',
                order: orderSaveResult,

            };
        } else {
            transaction.status = 'failed';
            order.status = 'failed';

            await this.transactionRepository.save(transaction);
            await this.orderRepository.save(order);

            // update ticket and seat status
            for (const orderDetail of order.orderDetails) {
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
                message: 'Payment failed',
            };
        }
    }





}