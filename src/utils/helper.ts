import * as bcrypt from 'bcrypt';
import { Stripe } from 'stripe';
import { OrderBillType, ProductType } from './type';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TicketType } from 'src/typeorm/entities/order/ticket-type';
import { ScheduleSeat } from 'src/typeorm/entities/cinema/schedule_seat';
import { Product } from 'src/typeorm/entities/item/product';

const SALT_ROUNDS = 10;


export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const changeVnToUSD = (total: string) => {
  const vndAmount = parseFloat(total.replace(/[,\s]/g, ''));
  if (isNaN(vndAmount)) {
    throw new Error('Invalid VND amount provided');
  }
  const exchangeRate = 24000;
  const usdAmount = vndAmount / exchangeRate;

  return usdAmount.toFixed(2);
};


export const changeUSDToVN = (total: string): string => {

  const usdAmount = parseFloat(total.replace(/[,\s]/g, ''));

  if (isNaN(usdAmount)) {
    throw new Error('Invalid USD amount provided');
  }

  const exchangeRate = 24000;

  const vndAmount = usdAmount * exchangeRate;

  return vndAmount.toFixed(0);
};

export const changeVNtoUSDToCent = (total: string): number => {
  const vndAmount = parseFloat(total.replace(/[,\s]/g, ''));
  if (isNaN(vndAmount)) {
    throw new Error('Invalid VND amount provided');
  }
  const exchangeRate = 24000;
  const usdAmount = vndAmount / exchangeRate;
  return Math.round(usdAmount * 100);
};

// Hàm áp dụng khuyến mãi (giảm giá)
export const applyPromotion = (price: number, discount: number, isPercent: boolean): number => {
  if (isPercent) {
    return Math.round(price * (1 - discount / 100));
  } else {
    return Math.round(price - discount);
  }
};

export const applyAudienceDiscount = (price: number, discount: number): number => {
  return Math.round(price * (1 - discount / 100));
};

export const roundUpToNearest = (value: number, step: number = 1000): number => {
  return Math.ceil(value / step) * step;
};

export const calculateProductTotal = (orderExtras: Product[], orderBill: OrderBillType) => {
  let totalProduct = 0;

  for (const product of orderExtras) {
    const found = (orderBill.products ?? []).find(p => p.product_id === product.id);
    if (!found || found.quantity <= 0) {
      throw new BadRequestException(`Invalid quantity for product ${product.id}`);
    }
    const productPrice = parseFloat(product.price);
    totalProduct += productPrice * found.quantity;
  }

  return totalProduct
};



export const LineItemsVisa = (
  orderBill: OrderBillType,
  scheduleSeats: ScheduleSeat[],
  ticketForAudienceTypes: TicketType[],
  orderExtras: ProductType[],
  promotionDiscount: number,
  isPercentage: boolean,
): Stripe.Checkout.SessionCreateParams.LineItem[] => {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  const seatPriceMap = new Map<string, number>(); // seatId -> price after audience discount
  let totalSeatPricesAfterAudience = 0;

  // === Tính giá từng vé sau audience discount ===
  for (const seatData of orderBill.seats) {
    const seat = scheduleSeats.find(s => s.seat.id === seatData.id);
    if (!seat) continue;

    const ticketType = ticketForAudienceTypes.find(t => t.audience_type === seatData.audience_type);
    const discount = parseFloat(ticketType?.discount ?? '0');
    const basePrice = Number(seat.seat.seatType.seat_type_price);
    const priceAfterAudience = applyAudienceDiscount(basePrice, discount);

    seatPriceMap.set(seatData.id, priceAfterAudience);
    totalSeatPricesAfterAudience += priceAfterAudience;
  }

  // === Tính tổng sản phẩm ===
  const productTotals = orderExtras.map(product => {
    const quantity = orderBill.products?.find(p => p.product_id === product.id)?.quantity || 0;
    return {
      product,
      quantity,
      total: Number(product.price) * quantity,
    };
  });

  const totalProductPrice = productTotals.reduce((sum, p) => sum + p.total, 0);
  const totalBeforePromotion = totalSeatPricesAfterAudience + totalProductPrice;

  // === Tính số tiền được giảm ===
  const promotionAmount = isPercentage
    ? Math.round(totalBeforePromotion * (promotionDiscount / 100))
    : Math.round(promotionDiscount);

  const seatRatio = totalSeatPricesAfterAudience / totalBeforePromotion;
  const productRatio = totalProductPrice / totalBeforePromotion;

  const seatDiscount = Math.round(promotionAmount * seatRatio);
  const productDiscount = promotionAmount - seatDiscount;

  // === Vé xem phim ===
  for (const seatData of orderBill.seats) {
    const seat = scheduleSeats.find(s => s.seat.id === seatData.id);
    if (!seat) continue;

    const ticketType = ticketForAudienceTypes.find(t => t.audience_type === seatData.audience_type);
    const discountPercent = parseFloat(ticketType?.discount || '0');
    const priceAfterAudience = seatPriceMap.get(seatData.id) || 0;

    const seatShareRatio = priceAfterAudience / totalSeatPricesAfterAudience;
    const seatDiscountShare = seatDiscount * seatShareRatio;
    const finalPrice = Math.round(priceAfterAudience - seatDiscountShare);

    lineItems.push({
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: changeVNtoUSDToCent(finalPrice.toString()),
        product_data: {
          name: `Ghế ${seat.seat.id} - ${seatData.audience_type}`,
          description: `Loại ghế: ${seat.seat.seatType.id}, audience: ${seatData.audience_type}, giảm ${discountPercent}%`,
        },
      },
    });
  }

  // === Sản phẩm ===
  const totalProductBeforePromo = Math.max(totalProductPrice, 1); // tránh chia 0

  for (const item of productTotals) {
    const { product, quantity, total } = item;
    if (quantity === 0) continue;

    const shareRatio = total / totalProductBeforePromo;
    const productDiscountShare = productDiscount * shareRatio;
    const unitDiscount = productDiscountShare / quantity;

    const unit_price_after_discount = Math.round(Number(product.price) - unitDiscount);

    lineItems.push({
      quantity,
      price_data: {
        currency: 'usd',
        unit_amount: changeVNtoUSDToCent(unit_price_after_discount.toString()),
        product_data: {
          name: product.name,
          description: product.category || '',
        },
      },
    });
  }

  return lineItems;
};



