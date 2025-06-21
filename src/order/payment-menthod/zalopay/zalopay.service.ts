import { Injectable, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";
import axios from "axios";
import * as moment from "moment";
import * as dayjs from "dayjs";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { OrderBillType, ZaloReturnQuery } from "src/utils/type";
import { Seat } from "src/typeorm/entities/cinema/seat";
import { TicketType } from "src/typeorm/entities/order/ticket-type";
import { MomoService } from "../momo/momo.service";

import { StatusOrder } from "src/enum/status-order.enum";
import { Product } from "src/typeorm/entities/item/product";
import { applyAudienceDiscount } from "src/utils/helper";
@Injectable()
export class ZalopayService {
  constructor(
    private momoService: MomoService,

  ) { }

  private app_id = Number(process.env.ZALO_APP_ID);
  private key1 = process.env.ZALO_KEY;
  private endpoint = process.env.ZALOPAY_ENDPOINT;
  private callback_url = process.env.ZALO_RETURN_URL;

  async createOrderZaloPay(
    orderItem: OrderBillType
  ) {
    if (!this.app_id || !this.key1 || !this.endpoint) {
      throw new Error("ZaloPay configuration is missing");
    }

    if (!orderItem || !Array.isArray(orderItem.seats) || orderItem.seats.length === 0) {
      throw new Error("No seat selected");
    }

    const transID = Date.now();
    const app_trans_id = `${moment().format("YYMMDD")}_${transID}`;




    const app_time = dayjs().valueOf();
    const embed_data = { redirecturl: this.callback_url };

    const rawData = {
      app_id: this.app_id,
      app_trans_id,
      app_user: "ZaloPay Movie Theater",
      amount: orderItem.total_prices,
      app_time,
      item: JSON.stringify([
        {
          itemid: `order_${this.app_id}`,
          itemname: "Thanh toán đơn hàng",
          itemprice: orderItem.total_prices,
          itemquantity: 1,
        }
      ]),
      embed_data: JSON.stringify(embed_data),
      description: "Thanh toán vé xem phim",
      bank_code: "zalopayapp",
    };

    const dataToMac = [
      rawData.app_id,
      rawData.app_trans_id,
      rawData.app_user,
      rawData.amount,
      rawData.app_time,
      rawData.embed_data,
      rawData.item,
    ].join("|");

    const mac = crypto.createHmac("sha256", this.key1).update(dataToMac).digest("hex");

    const requestBody = {
      ...rawData,
      mac,
    };

    try {
      const res = await axios.post(this.endpoint, requestBody, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.return_code !== 1) {
        throw new Error(`ZaloPay error: ${res.data.sub_return_message}`);
      }

      return {
        payUrl: res.data.order_url,
        orderId: app_trans_id,
      };
    } catch (error) {
      throw new Error("ZaloPay API failed: " + (error.response?.data?.sub_return_message || error.message));
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


  private verifyZaloReturnSignature(query: ZaloReturnQuery): boolean {
    const {
      appid,
      apptransid,
      pmcid,
      bankcode = '',
      amount,
      discountamount,
      status,
      checksum,
    } = query;

    const data = `${appid}|${apptransid}|${pmcid}|${bankcode}|${amount}|${discountamount}|${status}`;
    if (!this.key1) {
      throw new Error("ZaloPay key1 is not defined");
    }
    const hash = crypto.createHmac("sha256", this.key1).update(data).digest("hex");

    return hash === checksum;
  }
}