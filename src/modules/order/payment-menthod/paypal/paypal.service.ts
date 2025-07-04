import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { OrderBillType } from 'src/common/utils/type';
import { changeVnToUSD } from 'src/common/utils/helper';
import { Method } from 'src/common/enums/payment-menthod.enum';
import { MomoService } from '../momo/momo.service';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from 'src/common/exceptions/internal-server-error.exception';

@Injectable()
export class PayPalService {
  
    constructor(
        private readonly momoService: MomoService,
        private readonly configService: ConfigService,
    ) { }
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
        if (!accessToken) throw new Error('Failed to generate access token');


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
        const transaction = await this.momoService.getTransactionByOrderId(transactionCode);
        if (transaction.status !== StatusOrder.PENDING) {
            throw new NotFoundException('Transaction is not in pending state');
        }

        if (transaction.paymentMethod.id === Method.PAYPAL) {
            const captureResult = await this.captureOrderPaypal(transaction.transaction_code);
            if (captureResult.status !== 'COMPLETED') {
                throw new InternalServerErrorException('Payment not completed on PayPal');
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
