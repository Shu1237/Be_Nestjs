import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { OrderBillType } from 'src/utils/type';
import { changeVnToUSD } from 'src/utils/helper';
import { Method } from 'src/enum/payment-menthod.enum';
import { MomoService } from '../momo/momo.service';
import { StatusOrder } from 'src/enum/status-order.enum';

@Injectable()
export class PayPalService {
    constructor (
        private readonly momoService: MomoService,
    ){}
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

        if (transaction.paymentMethod.id === Method.PAYPAL) {
            const captureResult = await this.captureOrderPaypal(transaction.transaction_code);
            if (captureResult.status !== 'COMPLETED') {
                throw new Error('Payment not completed on PayPal');
            }
        }
        return this.momoService.handleReturnSuccess(transaction);
    }


    async handleReturnCancelPaypal(transactionCode: string) {
        const transaction = await this.momoService.getTransactionByOrderId(transactionCode);
        if (transaction.status !== StatusOrder.PENDING) {
            throw new NotFoundException('Transaction is not in pending state');
        }
       return this.momoService.handleReturnFailed(transaction);
       
    }
}
