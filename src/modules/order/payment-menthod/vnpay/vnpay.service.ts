import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as qs from 'qs';
import * as moment from 'moment';
import { MomoService } from '../momo/momo.service';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from 'src/common/exceptions/internal-server-error.exception';


@Injectable()
export class VnpayService {
  constructor(
    private readonly momoService: MomoService,
    private readonly configService: ConfigService,
  ) { }

  async createOrderVnPay(totalPrice: string, clientIp: string) {
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const orderId = moment(date).format('DDHHmmss');

    const tmnCode = this.configService.get<string>('vnpay.tmnCode');
    const secretKey = this.configService.get<string>('vnpay.hashSecret');
    const vnpUrl = this.configService.get<string>('vnpay.url');
    const returnUrl = this.configService.get<string>('vnpay.returnUrl');

    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
      throw new Error('VNPAY configuration is missing');
    }

    const amount = Number(totalPrice);
    const vnp_Params: Record<string, string> = {
      vnp_Amount: (amount * 100).toString(),
      vnp_BankCode: 'NCB',
      vnp_Command: 'pay',
      vnp_CreateDate: createDate,
      vnp_CurrCode: 'VND',
      vnp_IpAddr: clientIp,
      vnp_Locale: 'vn',
      vnp_OrderInfo: orderId,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: returnUrl,
      vnp_TmnCode: tmnCode,
      vnp_TxnRef: orderId,
      vnp_Version: '2.1.0',
    };

    // Sắp xếp thủ công theo thứ tự alphabet
    const sortedParams: Record<string, string> = {};
    Object.keys(vnp_Params)
      .sort()
      .forEach((key) => {
        sortedParams[key] = vnp_Params[key];
      });

    // Tạo chữ ký
    const signData = qs.stringify(sortedParams);
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    sortedParams['vnp_SecureHash'] = signed;
    const url = {
      payUrl: `${vnpUrl}?${qs.stringify(sortedParams)}`,
      orderId: orderId,
    };
    return url;
  }



  async handleReturnVnPay(query: any) {
    const receivedParams = { ...query };
    const secureHash = receivedParams['vnp_SecureHash'];

    delete receivedParams['vnp_SecureHash'];
    delete receivedParams['vnp_SecureHashType'];

    // Sắp xếp thủ công A-Z
    const sortedParams: Record<string, string> = {};
    Object.keys(receivedParams)
      .sort()
      .forEach((key) => {
        sortedParams[key] = receivedParams[key];
      });

    const signData = qs.stringify(sortedParams, { encode: false });
    const secretKey = this.configService.get<string>('vnpay.hashSecret');
    if (!secretKey) throw new InternalServerErrorException('Missing VNP_HASH_SECRET');

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      const responseCode = receivedParams['vnp_ResponseCode'];
      const txnRef = receivedParams['vnp_TxnRef'];
      const transaction = await this.momoService.getTransactionByOrderId(txnRef);
      if (transaction.status !== StatusOrder.PENDING) {
        throw new NotFoundException('Transaction is not in pending state');
      }
      if (responseCode === '00') {
        // Giao dịch thành công
        return this.momoService.handleReturnSuccess(transaction);
      } else {
        // Giao dịch thất bại
        return this.momoService.handleReturnFailed(transaction);
      }
    } else {
      return { success: false, message: 'Invalid signature from VNPAY' };
    }
  }
}
