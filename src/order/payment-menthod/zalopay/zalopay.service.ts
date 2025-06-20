import { Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import * as crypto from "crypto";
import axios from "axios";
import * as moment from "moment";
import * as dayjs from "dayjs";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { OrderBillType, ZaloReturnQuery } from "src/utils/type";
import { Seat } from "src/typeorm/entities/cinema/seat";
import { Order } from "src/typeorm/entities/order/order";
import { Ticket } from "src/typeorm/entities/order/ticket";
import { User } from "src/typeorm/entities/user/user";
import { Transaction } from "src/typeorm/entities/order/transaction";
import { TicketType } from "src/typeorm/entities/order/ticket-type";
import { Promotion } from "src/typeorm/entities/promotion/promotion";
import { MomoService } from "../momo/momo.service";
import { Role } from "src/enum/roles.enum";
import { StatusOrder } from "src/enum/status-order.enum";
import { HistoryScore } from "src/typeorm/entities/order/history_score";
import { Product } from "src/typeorm/entities/item/product";
import { applyAudienceDiscount, applyPromotion } from "src/utils/helper";
import { OrderExtra } from "src/typeorm/entities/order/order-extra";
import { MyGateWay } from "src/gateways/seat.gateway";

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(HistoryScore)
    private readonly historyScoreRepository: Repository<HistoryScore>,
    @InjectRepository(TicketType)
    private readonly ticketTypeRepository: Repository<TicketType>,
    @InjectRepository(OrderExtra)
    private readonly orderExtraRepository: Repository<OrderExtra>,


    private momoService: MomoService,
    private mygateway: MyGateWay
  ) { }

  private app_id = Number(process.env.ZALO_APP_ID);
  private key1 = process.env.ZALO_KEY;
  private endpoint = process.env.ZALOPAY_ENDPOINT;
  private callback_url = process.env.ZALO_RETURN_URL;

  async createOrderZaloPay(
    orderItem: OrderBillType,
    orderExtras: Product[] = [],
    promotionDiscount: number,
    isPercentage: boolean
  ) {
    if (!this.app_id || !this.key1 || !this.endpoint) {
      throw new Error("ZaloPay configuration is missing");
    }

    if (!orderItem || !Array.isArray(orderItem.seats) || orderItem.seats.length === 0) {
      throw new Error("No seat selected");
    }

    const transID = Date.now();
    const app_trans_id = `${moment().format("YYMMDD")}_${transID}`;
    const items: { itemid: string; itemname: string; itemprice: number; itemquantity: number }[] = [];

    let seatTotal = 0;
    let productTotal = 0;

    const seatDetails: { id: string; name: string; basePrice: number; discount: number; finalPrice: number }[] = [];
    for (const seatItem of orderItem.seats) {
      const seat = await this.seatRepository.findOne({ where: { id: seatItem.id }, relations: ["seatType"] });
      const ticketType = await this.ticketTypeRepository.findOne({ where: { audience_type: seatItem.audience_type } });

      if (!seat || !ticketType) {
        throw new NotFoundException("Seat or ticket type not found");
      }

      const basePrice = seat.seatType.seat_type_price;
      const discount = parseFloat(ticketType.discount);
      const finalPrice = applyAudienceDiscount(basePrice, discount);

      seatTotal += finalPrice;

      seatDetails.push({
        id: seatItem.id,
        name: `Seat ${seatItem.seat_row}${seatItem.seat_column}`,
        basePrice,
        discount,
        finalPrice,
      });
    }

    const productDetails: {
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[] = [];
    if (Array.isArray(orderItem.products)) {
      for (const prod of orderItem.products) {
        const product = orderExtras.find(p => p.id === prod.product_id);
        if (!product) continue;

        const quantity = prod.quantity ?? 1;
        const unitPrice = Number(product.price);
        const totalPrice = quantity * unitPrice;

        productTotal += totalPrice;

        productDetails.push({
          id: product.id.toString(),
          name: product.name,
          quantity,
          unitPrice,
          totalPrice,
        });
      }
    }

    const totalBeforeDiscount = seatTotal + productTotal;
    const totalPromotionAmount = isPercentage
      ? Math.round(totalBeforeDiscount * (promotionDiscount / 100))
      : Math.round(promotionDiscount);

    const seatRatio = seatTotal / (totalBeforeDiscount || 1); // tránh chia 0
    const productRatio = productTotal / (totalBeforeDiscount || 1);

    const seatDiscountTotal = Math.round(totalPromotionAmount * seatRatio);
    const productDiscountTotal = totalPromotionAmount - seatDiscountTotal;

    // Ghế sau giảm
    for (const seat of seatDetails) {
      const seatShare = seat.finalPrice / (seatTotal || 1);
      const discountAmount = seatDiscountTotal * seatShare;
      const finalPrice = Math.round(seat.finalPrice - discountAmount);

      items.push({
        itemid: seat.id,
        itemname: seat.name,
        itemprice: finalPrice,
        itemquantity: 1,
      });
    }

    // Sản phẩm sau giảm
    for (const product of productDetails) {
      const shareRatio = product.totalPrice / (productTotal || 1);
      const productDiscountShare = productDiscountTotal * shareRatio;
      const unitDiscount = productDiscountShare / product.quantity;
      const finalPrice = Math.round(product.unitPrice - unitDiscount);

      items.push({
        itemid: `product_${product.id}`,
        itemname: product.name,
        itemprice: finalPrice,
        itemquantity: product.quantity,
      });
    }

    const totalPriceVND = items.reduce((sum, item) => sum + item.itemprice * item.itemquantity, 0);

    const app_time = dayjs().valueOf();
    const embed_data = { redirecturl: this.callback_url };

    const rawData = {
      app_id: this.app_id,
      app_trans_id,
      app_user: "ZaloPay Movie Theater",
      amount: totalPriceVND,
      app_time,
      item: JSON.stringify(items),
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
    const order = transaction.order;

    if (status === "1") {
      transaction.status = StatusOrder.SUCCESS;
      order.status = StatusOrder.SUCCESS;
      await this.transactionRepository.save(transaction);
      const savedOrder = await this.orderRepository.save(order);
      ``
      // Cộng điểm cho người dùng
      if (order.user?.role.role_id === Role.USER) {
        const orderScore = Math.floor(Number(order.total_prices) / 1000);
        const addScore = orderScore - (order.promotion?.exchange ?? 0);
        order.user.score += addScore;
        await this.userRepository.save(order.user);
        // history score
        await this.historyScoreRepository.save({
          score_change: addScore,
          user: order.user,
          order: savedOrder,
        });
      }
      for (const detail of order.orderDetails) {
        const ticket = detail.ticket;
        if (ticket) {
          ticket.status = true;
          await this.ticketRepository.save(ticket);
        }
      }
      // order extras
      if (order.orderExtras && order.orderExtras.length > 0) {
        for (const extra of order.orderExtras) {
          extra.status = StatusOrder.SUCCESS;
          await this.orderExtraRepository.save(extra);
        }
      }
      // send email notification
      try {
        await this.momoService.sendOrderConfirmationEmail(order, transaction);
      } catch (error) {
        console.error('Mailer error:', error);
        throw new NotFoundException('Failed to send confirmation email');
      }
      // Gửi thông báo đến client qua WebSocket
      this.mygateway.onBookSeat({
        schedule_id: order.orderDetails[0].ticket.schedule.id,
        seatIds: order.orderDetails.map(detail => detail.ticket.seat.id),
      });
      return {
        message: "Payment successful",
        order: savedOrder,
      };
    } else {
      const transaction = await this.momoService.getTransactionByOrderId(apptransid);
      const order = transaction.order;
      transaction.status = StatusOrder.FAILED;
      order.status = StatusOrder.FAILED;
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