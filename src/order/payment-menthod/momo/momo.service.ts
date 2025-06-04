import { Injectable, NotFoundException } from "@nestjs/common";
import * as crypto from 'crypto';
import axios from 'axios';
import { Transaction } from "src/typeorm/entities/order/transaction";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "src/typeorm/entities/order/order";

@Injectable()
export class MomoService {

    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
    ) { }
    async createPayment(total: string) {
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const secretKey = process.env.MOMO_SECRET_KEY;
        if (!secretKey) {
            throw new Error('MOMO_SECRET_KEY is not defined in environment variables');
        }
        const partnerCode = 'MOMO';
        const orderInfo = ' Momo Payment';
        const redirectUrl = process.env.MOMO_REDIRECT_URL;
        const ipnUrl = process.env.MOMO_IPN_URL;
        const requestType = 'payWithMethod';
        const amount = total;
        const orderId = `${partnerCode}${Date.now()}`;
        const requestId = orderId;
        const extraData = '';
        const orderGroupId = '';
        const autoCapture = true;
        const lang = 'en';


        // 1. Tạo chuỗi raw signature
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

        // 2. Tạo chữ ký HMAC SHA256
        const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

        // 3. Tạo JSON body gửi đi
        const requestBody = JSON.stringify({
            partnerCode,
            partnerName: 'Test',
            storeId: 'MomoTestStore',
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
        let result: any;
        try {
            result = await axios.post(options.url, options.data, { headers: options.headers });
            // console.log('--------------------RESULT----------------');
            // console.log(result.data);
            return result.data;
        } catch (error) {
            console.error('Error occurred while sending request:', error);
            return {
                error: 'Failed to create payment',
            }
        }
    }



    async handleReturn(res, query: any) {
        const { orderId, resultCode } = query;

        // Tìm transaction theo orderId (transaction_code bên mình đặt là orderId Momo)
        const transaction = await this.transactionRepository.findOne({
            where: { transaction_code: orderId },
            relations: ['order'], // để update luôn order
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (resultCode === '0') {
            // ✅ Thành công: cập nhật trạng thái
            transaction.status = 'success';
            transaction.order.status = 'paid';


            await this.transactionRepository.save(transaction);
            await this.orderRepository.save(transaction.order);


            return {
                message: 'Payment successful',
                orderId: query.orderId,
                requestId: query.requestId,
                amount: query.amount,
            };
        } else {
            // ❌ Thất bại: cập nhật trạng thái
            transaction.status = 'failed';
            transaction.order.status = 'failed';

            await this.transactionRepository.save(transaction);
            await this.orderRepository.save(transaction.order);

            return {
                message: 'Payment failed',
                orderId: query.orderId,
                requestId: query.requestId,
                amount: query.amount,
                resultCode: query.resultCode,
                messageError: query.message,
            };
        }
    }


}