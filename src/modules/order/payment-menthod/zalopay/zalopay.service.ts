import { Injectable, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";
import axios from "axios";
import * as moment from "moment";
import * as dayjs from "dayjs";
import { OrderBillType, ZaloReturnQuery } from "src/common/utils/type";
import { MomoService } from "../momo/momo.service";
import { StatusOrder } from "src/common/enums/status-order.enum";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException } from "src/common/exceptions/internal-server-error.exception";
@Injectable()
export class ZalopayService {
  constructor(
    private readonly momoService: MomoService,
    private readonly configService: ConfigService,

  ) { }


  async createOrderZaloPay(orderItem: OrderBillType) {
    // console.log(orderItem);

    const app_id = this.configService.get<string>('zalopay.appId');
    const key1 = this.configService.get<string>('zalopay.key1');
    const endpoint = this.configService.get<string>('zalopay.endpoint');
    const callback_url = this.configService.get<string>('zalopay.returnUrl');

    if (!app_id || !key1 || !endpoint) {
      throw new InternalServerErrorException("ZaloPay configuration is missing");
    }

    if (!orderItem || !Array.isArray(orderItem.seats) || orderItem.seats.length === 0) {
      throw new InternalServerErrorException("No seat selected");
    }

    const transID = Date.now();
    const app_trans_id = `${moment().format("YYMMDD")}_${transID}`;
    const app_time = dayjs().valueOf();
    const embed_data = { redirecturl: callback_url };

    const rawData = {
      app_id: Number(app_id),
      app_trans_id,
      app_user: "ZaloPay Movie Theater",
      amount: Number(orderItem.total_prices),
      app_time,
      item: JSON.stringify([
        {
          itemid: `order_${app_id}`,
          itemname: "Thanh toan don hang",
          itemprice: Number(orderItem.total_prices),
          itemquantity: 1,
        },
      ]),
      embed_data: JSON.stringify(embed_data),
      description: "Thanh toan ve xem phim",
      bank_code: "zalopayapp",
    };
    //  console.log(rawData);
    const dataToMac = [
      rawData.app_id,
      rawData.app_trans_id,
      rawData.app_user,
      rawData.amount,
      rawData.app_time,
      rawData.embed_data,
      rawData.item,
    ].join("|");

    const mac = crypto.createHmac("sha256", key1).update(dataToMac).digest("hex");

    const requestBody = {
      ...rawData,
      mac,
    };

    try {
      const res = await axios.post(endpoint, requestBody, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.return_code !== 1) {
        throw new InternalServerErrorException(`ZaloPay error: ${res.data.sub_return_message}`);
      }

      return {
        payUrl: res.data.order_url,
        orderId: app_trans_id,
      };
    } catch (error) {
      console.error("ZaloPay API error:", error);
      throw new InternalServerErrorException(
        "ZaloPay API failed: " +
        (error.response?.data?.sub_return_message || error.message),
      );
    }
  }


  async handleReturnZaloPay(query: any) {
    // if (!this.verifyZaloReturnSignature(query)) {
    //   throw new UnauthorizedException("Invalid ZaloPay signature");
    // }
    const { apptransid, status } = query;
    const transaction = await this.momoService.getTransactionByOrderId(apptransid);
    if (transaction.status !== StatusOrder.PENDING) {
      throw new NotFoundException('Transaction is not in pending state');
    }
    if (status === "1") {
      return this.momoService.handleReturnSuccess(transaction);
    } else {
      return this.momoService.handleReturnFailed(transaction);
    }
  }


  // private verifyZaloReturnSignature(query: ZaloReturnQuery): boolean {
  //   const {
  //     appid,
  //     apptransid,
  //     pmcid,
  //     bankcode = '',
  //     amount,
  //     discountamount,
  //     status,
  //     checksum,
  //   } = query;

  //   const data = `${appid}|${apptransid}|${pmcid}|${bankcode}|${amount}|${discountamount}|${status}`;
  //   const key1 = this.configService.get<string>('zalopay.key1');

  //   if (!key1) {
  //     throw new Error("ZaloPay key1 is not defined");
  //   }
  //   const hash = crypto.createHmac("sha256", key1).update(data).digest("hex");

  //   return hash === checksum;
  // }
}