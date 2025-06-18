import { Injectable } from "@nestjs/common";


import { OrderBillType } from "src/utils/type";
import Stripe from "stripe";


@Injectable()
export class VisaService {
    private stripe: Stripe;

    constructor(
    ) {
        this.stripe = new Stripe(process.env.VISA_SECRET_KEY as string);
    }

    async createOrderVisa(line_items: Stripe.Checkout.SessionCreateParams.LineItem[], orderBill: OrderBillType) {

        if (!line_items || line_items.length === 0) {
            throw new Error('No items to create a payment session');
        }
        const session = await this.stripe.checkout.sessions.create({
            line_items,
            mode: 'payment',
            success_url: `${process.env.VISA_SUCCESS_URL}?orderId={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.VISA_CANCEL_URL}?orderId={CHECKOUT_SESSION_ID}`,
            metadata: {
                payment_method_id: orderBill.payment_method_id,
                promotion_id: orderBill.promotion_id.toString(),
                schedule_id: orderBill.schedule_id.toString(),
                total_prices: orderBill.total_prices,

            },
        });
        const url = {
            payUrl: session.url,
            orderId: session.id,
        };
        return url;
    }


}


