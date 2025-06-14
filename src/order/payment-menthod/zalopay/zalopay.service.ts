import { Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import * as crypto from "crypto";
import axios from "axios";
import * as moment from "moment";
import * as dayjs from "dayjs";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { OrderBillType } from "src/utils/type";
import { Seat } from "src/typeorm/entities/cinema/seat";
import { Order } from "src/typeorm/entities/order/order";
import { Ticket } from "src/typeorm/entities/order/ticket";
import { Member } from "src/typeorm/entities/user/member";
import { User } from "src/typeorm/entities/user/user";
import { Transaction } from "src/typeorm/entities/order/transaction";
import { TicketType } from "src/typeorm/entities/order/ticket-type";
import { Promotion } from "src/typeorm/entities/promotion/promotion";
import { MailerService } from "@nestjs-modules/mailer";
import { MomoService } from "../momo/momo.service";
import { Role } from "src/enum/roles.enum";
import { StatusOrder } from "src/enum/status-order.enum";

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
    @InjectRepository(TicketType)
    private readonly ticketTypeRepository: Repository<TicketType>,
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,

    private mailerService: MailerService,
    private momoService: MomoService
  ) { }

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
    const embed_data = {
      redirecturl: this.callback_url,
    };
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

      if ((order.user?.member && order.user.role.role_id === Role.USER)) {
        order.user.member.score += order.add_score;
        await this.memberRepository.save(order.user.member);
      }

      for (const detail of order.orderDetails) {
        const ticket = detail.ticket;
        if (ticket) {
          ticket.status = true;
          await this.ticketRepository.save(ticket);
        }
      }
      // send email notification
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
}
