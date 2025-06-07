import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { OrderBillType } from "src/utils/type";
import Stripe from "stripe";
import { TicketType } from "src/typeorm/entities/order/ticket-type";
import { Seat } from "src/typeorm/entities/cinema/seat";
import { Promotion } from "src/typeorm/entities/promotion/promotion";
import {  changeVNtoUSDToCent } from "src/utils/helper";

@Injectable()
export class VisaService {
    private stripe: Stripe;

    constructor(
        @InjectRepository(TicketType)
        private ticketTypeRepository: Repository<TicketType>,
        @InjectRepository(Seat)
        private seatRepository: Repository<Seat>,
        @InjectRepository(Promotion)
        private promotionRepository: Repository<Promotion>,
    ) {
        this.stripe = new Stripe(process.env.VISA_SECRET_KEY as string);
    }

    async createOrderVisa(item: OrderBillType) {
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

        const promotion = await this.promotionRepository.findOne({ where: { id: item.promotion_id } });
        const promotionDiscount = promotion ? Number(promotion.discount) : 0;

        for (const seat of item.seats) {
            const basePrice = await this.getSeatBasePrice(seat.id);
            const ticketDiscount = await this.getTicketDiscount(seat.audience_type);

            const discountedPrice = basePrice * (1 - ticketDiscount / 100);
            const finalPrice = (discountedPrice * (1 - promotionDiscount / 100)).toString();

            const priceInUSD = Number(changeVNtoUSDToCent(finalPrice));

            line_items.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Seat ${seat.seat_row}${seat.seat_column} - ${seat.audience_type}`,
                    },
                    unit_amount: priceInUSD,
                },
                quantity: 1,
            });
        }

        const session = await this.stripe.checkout.sessions.create({
            line_items,
            mode: 'payment',
            success_url: `${process.env.VISA_SUCCESS_URL}?orderId={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.VISA_CANCEL_URL}?orderId={CHECKOUT_SESSION_ID}`,
            metadata: {
                payment_method_id: item.payment_method_id,
                promotion_id: item.promotion_id.toString(),
                schedule_id: item.schedule_id.toString(),
                booking_date: item.booking_date.toISOString(),
                total_prices: item.total_prices,
            },
        });
        const url = {
            payUrl: session.url,
            orderId: session.id,
        };
        return url;
    }

    async getSeatBasePrice(seatId: string): Promise<number> {
        const seat = await this.seatRepository.findOne({
            where: { id: seatId },
            relations: ['seatType'],
        });
        if (!seat) throw new Error(`Seat with ID ${seatId} not found`);
        return seat.seatType.seat_type_price;
    }

    async getTicketDiscount(audienceType: string): Promise<number> {
        const ticketType = await this.ticketTypeRepository.findOne({
            where: { audience_type: audienceType },
        });
        if (!ticketType) throw new Error(`Ticket type not found for audience: ${audienceType}`);
        return Number(ticketType.discount);
    }
}
