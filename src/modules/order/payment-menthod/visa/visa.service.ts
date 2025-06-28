import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException } from "src/common/exceptions/internal-server-error.exception";
import { changeVNtoUSDToCent } from "src/common/utils/helper";
import { OrderBillType } from "src/common/utils/type";
import Stripe from "stripe";


@Injectable()
export class VisaService {
    private stripe: Stripe;

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.stripe = new Stripe(this.configService.get<string>('visa.secretKey') as string);
    }

    async createOrderVisa(orderBill: OrderBillType) {
        const session = await this.stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Order Bill Payment by Visa',
                        },
                        unit_amount: changeVNtoUSDToCent(orderBill.total_prices),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${this.configService.get<string>('visa.successUrl')}?orderId={CHECKOUT_SESSION_ID}`,
            cancel_url: `${this.configService.get<string>('visa.cancelUrl')}?orderId={CHECKOUT_SESSION_ID}`,
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


