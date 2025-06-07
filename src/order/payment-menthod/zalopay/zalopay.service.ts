import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import * as crypto from "crypto";
import axios from "axios";
import * as moment from "moment";
import * as dayjs from "dayjs";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrderBillType } from "src/utils/type";
import { Seat } from "src/typeorm/entities/cinema/seat";
import { Order } from "src/typeorm/entities/order/order";
import { Ticket } from "src/typeorm/entities/order/ticket";
import { Member } from "src/typeorm/entities/user/member";
import { User } from "src/typeorm/entities/user/user";
import { Transaction } from "src/typeorm/entities/order/transaction";
import { TicketType } from "src/typeorm/entities/order/ticket-type";
import { Promotion } from "src/typeorm/entities/promotion/promotion";

@Injectable()
export class ZalopayService {
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
    @InjectRepository(TicketType)
    private readonly ticketTypeRepository: Repository<TicketType>,
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
  ) {}

  private app_id = Number(process.env.ZALO_APP_ID);
  private key1 = process.env.ZALO_KEY;
  private endpoint = process.env.ZALOPAY_ENDPOINT;
  private callback_url = process.env.ZALO_RETURN_URL;

  async createOrderZaloPay(orderItem: OrderBillType) {
    if (!this.app_id || !this.key1 || !this.endpoint) {
      throw new Error("ZaloPay configuration is missing");
    }

    if (!orderItem || !Array.isArray(orderItem.seats) || orderItem.seats.length === 0) {
      throw new Error("No seat selected");
    }

    const transID = Date.now();
    const app_trans_id = `${moment().format("YYMMDD")}_${transID}`;
    const amount = Number(orderItem.total_prices)

    if (isNaN(amount) || amount <= 0) {
      throw new Error("Invalid total price for ZaloPay order");
    }

    const items: { itemid: string; itemname: string; itemprice: number; itemquantity: number }[] = [];

    for (const item of orderItem.seats) {
      const seat = await this.seatRepository.findOne({ where: { id: item.id }, relations: ["seatType"] });
      const ticketType = await this.ticketTypeRepository.findOne({ where: { audience_type: item.audience_type } });

      if (!seat || !ticketType) {
        throw new NotFoundException("Seat or ticket type not found");
      }

      const discount = parseFloat(ticketType.discount) / 100;
      let seatPrice = seat.seatType.seat_type_price * (1 - discount);

      items.push({
        itemid: item.id,
        itemname: `Seat ${item.seat_row}${item.seat_column}`,
        itemprice: Math.round(seatPrice),
        itemquantity: 1,
      });
    }

    if (orderItem.promotion_id) {
      const promotion = await this.promotionRepository.findOne({ where: { id: orderItem.promotion_id } });
      if (!promotion) throw new NotFoundException("Promotion not found");

      const promoDiscount = parseFloat(promotion.discount) / 100;
      items.forEach(i => {
        i.itemprice = Math.round(i.itemprice * (1 - promoDiscount));
      });
    }

    const app_time = dayjs().valueOf();
    const embed_data = {};
    const item = items;

    const rawData = {
      app_id: this.app_id,
      app_trans_id,
      app_user: "ZaloPay Movie Theater",
      amount,
      app_time,
      item: JSON.stringify(item),
      embed_data: JSON.stringify(embed_data),
      description: "Thanh toán vé xem phim",
      bank_code: "zalopayapp",
      callback_url: this.callback_url,
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

  async getTransactionByOrderId(orderId: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { transaction_code: orderId },
      relations: [
        "order",
        "order.orderDetails",
        "order.orderDetails.ticket",
        "order.orderDetails.ticket.seat",
        "order.user",
        "order.user.member",
      ],
    });

    if (!transaction) throw new NotFoundException("Transaction not found");

    return transaction;
  }

  async handleReturnZaloPay(query: any) {
    const { appid, apptransid, amount, status, checksum } = query;

    if (!this.key1) throw new Error("ZaloPay key is not configured");

    const data = `${appid}|${apptransid}|${amount}|${status}|${this.key1}`;
    const calculatedChecksum = crypto.createHmac("sha256", this.key1).update(data).digest("hex");

    if (checksum !== calculatedChecksum) {
      throw new UnauthorizedException("Invalid ZaloPay checksum");
    }

    const transaction = await this.getTransactionByOrderId(apptransid);
    const order = transaction.order;

    if (status === "1") {
      transaction.status = "success";
      order.status = "success";
      await this.transactionRepository.save(transaction);
      const savedOrder = await this.orderRepository.save(order);

      if (order.user?.member) {
        order.user.member.score += order.add_score || 0;
        await this.memberRepository.save(order.user.member);
      }

      for (const detail of order.orderDetails) {
        const ticket = detail.ticket;
        if (ticket) {
          ticket.status = true;
          await this.ticketRepository.save(ticket);
        }
      }

      return {
        message: "Payment successful",
        order: savedOrder,
      };
    } else {
      transaction.status = "failed";
      order.status = "failed";
      await this.transactionRepository.save(transaction);
      await this.orderRepository.save(order);

      for (const detail of order.orderDetails) {
        const ticket = detail.ticket;
        if (ticket?.seat) {
          ticket.seat.status = false;
          await this.seatRepository.save(ticket.seat);
        }
      }

      return { message: "Payment failed" };
    }
  }
}
